const AWS = require('aws-sdk');
const jwt = require('jsonwebtoken');

const dynamoDB = new AWS.DynamoDB.DocumentClient();
const POSTS_TABLE = process.env.POSTS_TABLE || 'twitter-clone-posts';
const USERS_TABLE = process.env.USERS_TABLE || 'twitter-clone-usuarios';
const COMMENTS_TABLE = process.env.COMMENTS_TABLE || 'twitter-clone-comentarios';
const LIKES_TABLE = process.env.LIKES_TABLE || 'twitter-clone-postlikes';
const JWT_SECRET = process.env.JWT_SECRET || 'MyS3cr3tK3yF0rJWTT0k3nG3n3r4t10nTh4tSh0uldB3V3ryS3cur3AndL0ng';

// Verify JWT token
function verifyToken(authHeader) {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new Error('Token no proporcionado');
    }
    
    const token = authHeader.substring(7);
    return jwt.verify(token, JWT_SECRET);
}

exports.handler = async (event) => {
    console.log('Event:', JSON.stringify(event, null, 2));
    
    const headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,Authorization',
        'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
    };
    
    // Handle CORS preflight
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers,
            body: ''
        };
    }
    
    const path = event.path || event.resource;
    const resource = event.resource || event.path;
    const method = event.httpMethod;
    
    try {
        // POST /posts - Create post
    if (method === 'POST' && (resource === '/posts')) {
            const authHeader = event.headers.Authorization || event.headers.authorization;
            const decoded = verifyToken(authHeader);
            
            const body = JSON.parse(event.body);
            const { contenido } = body;
            
            if (!contenido || contenido.trim().length === 0) {
                return {
                    statusCode: 400,
                    headers,
                    body: JSON.stringify({ message: 'El contenido es obligatorio' })
                };
            }
            
            if (contenido.length > 140) {
                return {
                    statusCode: 400,
                    headers,
                    body: JSON.stringify({ message: 'El post no puede exceder 140 caracteres' })
                };
            }
            
            // Get user info
            const userResult = await dynamoDB.get({
                TableName: USERS_TABLE,
                Key: { id: decoded.id }
            }).promise();
            
            if (!userResult.Item) {
                return {
                    statusCode: 404,
                    headers,
                    body: JSON.stringify({ message: 'Usuario no encontrado' })
                };
            }
            
            const postId = Date.now().toString() + Math.random().toString(36).substr(2, 9);
            const post = {
                id: postId,
                contenido: contenido.trim(),
                usuarioId: decoded.id,
                usuario: {
                    id: userResult.Item.id,
                    username: userResult.Item.username,
                    email: userResult.Item.email
                },
                likes: 0,
                createdAt: new Date().toISOString()
            };
            
            await dynamoDB.put({
                TableName: POSTS_TABLE,
                Item: post
            }).promise();
            
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify(post)
            };
        }
        
        // GET /posts - Get all posts
    if (method === 'GET' && (resource === '/posts')) {
            const result = await dynamoDB.scan({
                TableName: POSTS_TABLE
            }).promise();
            
            // Sort by createdAt descending
            const posts = result.Items.sort((a, b) => 
                new Date(b.createdAt) - new Date(a.createdAt)
            );
            
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify(posts)
            };
        }
        
        // GET /posts/usuario/{usuarioId}
        if (method === 'GET' && (resource === '/posts/usuario/{usuarioId}')) {
            const usuarioId = event.pathParameters?.usuarioId || 
                             path.split('/').pop();
            
            const result = await dynamoDB.query({
                TableName: POSTS_TABLE,
                IndexName: 'usuarioId-index',
                KeyConditionExpression: 'usuarioId = :usuarioId',
                ExpressionAttributeValues: {
                    ':usuarioId': usuarioId
                }
            }).promise();
            
            const posts = result.Items.sort((a, b) => 
                new Date(b.createdAt) - new Date(a.createdAt)
            );
            
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify(posts)
            };
        }
        
        // PUT /posts/{postId}/like
        if (method === 'PUT' && (resource === '/posts/{postId}/like')) {
            const authHeader = event.headers.Authorization || event.headers.authorization;
            const decoded = verifyToken(authHeader);

            const postId = event.pathParameters?.postId || 
                          path.split('/')[path.split('/').length - 2];

            // Validate post exists
            const postRes = await dynamoDB.get({ TableName: POSTS_TABLE, Key: { id: postId } }).promise();
            if (!postRes.Item) {
                return { statusCode: 404, headers, body: JSON.stringify({ message: 'Post no encontrado' }) };
            }

            // Check if user already liked
            const likeKey = { postId, userId: decoded.id };
            const existing = await dynamoDB.get({ TableName: LIKES_TABLE, Key: likeKey }).promise();

            let liked;
            let inc;
            if (existing.Item) {
                // Unlike: remove record, decrement
                await dynamoDB.delete({ TableName: LIKES_TABLE, Key: likeKey }).promise();
                liked = false;
                inc = -1;
            } else {
                // Like: add record, increment
                await dynamoDB.put({ TableName: LIKES_TABLE, Item: likeKey }).promise();
                liked = true;
                inc = 1;
            }

            // Update likes count atomically
            await dynamoDB.update({
                TableName: POSTS_TABLE,
                Key: { id: postId },
                UpdateExpression: 'SET likes = if_not_exists(likes, :zero) + :inc',
                ExpressionAttributeValues: {
                    ':zero': 0,
                    ':inc': inc
                }
            }).promise();

            // Fetch updated likes
            const updated = await dynamoDB.get({ TableName: POSTS_TABLE, Key: { id: postId } }).promise();
            return { statusCode: 200, headers, body: JSON.stringify({ likes: updated.Item.likes || 0, liked }) };
        }

        // GET /posts/{postId}/comentarios
        if (method === 'GET' && (resource === '/posts/{postId}/comentarios')) {
            const postId = event.pathParameters?.postId || path.split('/')[2];

            // Validate post exists
            const post = await dynamoDB.get({
                TableName: POSTS_TABLE,
                Key: { id: postId }
            }).promise();
            if (!post.Item) {
                return { statusCode: 404, headers, body: JSON.stringify({ message: 'Post no encontrado' }) };
            }

            const result = await dynamoDB.query({
                TableName: COMMENTS_TABLE,
                IndexName: 'postId-index',
                KeyConditionExpression: 'postId = :postId',
                ExpressionAttributeValues: { ':postId': postId }
            }).promise();

            const comentarios = (result.Items || []).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            return { statusCode: 200, headers, body: JSON.stringify(comentarios) };
        }

        // POST /posts/{postId}/comentarios
        if (method === 'POST' && (resource === '/posts/{postId}/comentarios')) {
            const authHeader = event.headers.Authorization || event.headers.authorization;
            const decoded = verifyToken(authHeader);

            const postId = event.pathParameters?.postId || path.split('/')[2];
            const body = JSON.parse(event.body || '{}');
            const { contenido } = body;

            if (!contenido || !contenido.trim()) {
                return { statusCode: 400, headers, body: JSON.stringify({ message: 'El contenido es obligatorio' }) };
            }
            if (contenido.length > 280) {
                return { statusCode: 400, headers, body: JSON.stringify({ message: 'El comentario no puede exceder 280 caracteres' }) };
            }

            // Validate post exists
            const post = await dynamoDB.get({ TableName: POSTS_TABLE, Key: { id: postId } }).promise();
            if (!post.Item) {
                return { statusCode: 404, headers, body: JSON.stringify({ message: 'Post no encontrado' }) };
            }

            const user = await dynamoDB.get({ TableName: USERS_TABLE, Key: { id: decoded.id } }).promise();
            if (!user.Item) {
                return { statusCode: 404, headers, body: JSON.stringify({ message: 'Usuario no encontrado' }) };
            }

            const commentId = Date.now().toString() + Math.random().toString(36).substr(2, 9);
            const comentario = {
                id: commentId,
                postId,
                contenido: contenido.trim(),
                usuario: {
                    id: user.Item.id,
                    username: user.Item.username,
                    email: user.Item.email
                },
                createdAt: new Date().toISOString()
            };

            await dynamoDB.put({ TableName: COMMENTS_TABLE, Item: comentario }).promise();
            return { statusCode: 200, headers, body: JSON.stringify(comentario) };
        }

        // GET /posts/{postId}/stats
        if (method === 'GET' && (resource === '/posts/{postId}/stats')) {
            const postId = event.pathParameters?.postId || path.split('/')[2];

            const post = await dynamoDB.get({ TableName: POSTS_TABLE, Key: { id: postId } }).promise();
            if (!post.Item) {
                return { statusCode: 404, headers, body: JSON.stringify({ message: 'Post no encontrado' }) };
            }

            const commentsCount = await dynamoDB.query({
                TableName: COMMENTS_TABLE,
                IndexName: 'postId-index',
                KeyConditionExpression: 'postId = :postId',
                ExpressionAttributeValues: { ':postId': postId },
                Select: 'COUNT'
            }).promise();

            // Optional: determine if current user liked
            let liked = false;
            const authHeader = event.headers?.Authorization || event.headers?.authorization;
            if (authHeader && authHeader.startsWith('Bearer ')) {
                try {
                    const decoded = verifyToken(authHeader);
                    const like = await dynamoDB.get({ TableName: LIKES_TABLE, Key: { postId, userId: decoded.id } }).promise();
                    liked = !!like.Item;
                } catch {}
            }

            return { statusCode: 200, headers, body: JSON.stringify({ likes: post.Item.likes || 0, comentarios: commentsCount.Count || 0, liked }) };
        }
        
        return {
            statusCode: 404,
            headers,
            body: JSON.stringify({ message: 'Ruta no encontrada' })
        };
        
    } catch (error) {
        console.error('Error:', error);
        
        if (error.name === 'JsonWebTokenError' || error.message.includes('Token')) {
            return {
                statusCode: 401,
                headers,
                body: JSON.stringify({ message: 'Token inválido o no proporcionado' })
            };
        }
        
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ 
                message: 'Error interno del servidor',
                error: error.message 
            })
        };
    }
};
