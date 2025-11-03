const AWS = require('aws-sdk');

const dynamoDB = new AWS.DynamoDB.DocumentClient();
const POSTS_TABLE = process.env.POSTS_TABLE || 'twitter-clone-posts';

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
    const method = event.httpMethod;
    
    try {
        // GET /stream
        if (path.includes('/stream') && method === 'GET' && !path.includes('posts')) {
            const result = await dynamoDB.scan({
                TableName: POSTS_TABLE
            }).promise();
            
            // Sort by createdAt descending
            const posts = result.Items.sort((a, b) => 
                new Date(b.createdAt) - new Date(a.createdAt)
            );
            
            const stream = {
                id: '1',
                nombre: 'Stream Global',
                descripcion: 'Stream unificado con todos los posts',
                createdAt: new Date().toISOString(),
                posts: posts
            };
            
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify(stream)
            };
        }
        
        // GET /stream/posts
        if (path.includes('/stream/posts') && method === 'GET') {
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
        
        return {
            statusCode: 404,
            headers,
            body: JSON.stringify({ message: 'Ruta no encontrada' })
        };
        
    } catch (error) {
        console.error('Error:', error);
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
