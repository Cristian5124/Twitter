const AWS = require('aws-sdk');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const dynamoDB = new AWS.DynamoDB.DocumentClient();
const USERS_TABLE = process.env.USERS_TABLE || 'twitter-clone-usuarios';
const JWT_SECRET = process.env.JWT_SECRET || 'MyS3cr3tK3yF0rJWTT0k3nG3n3r4t10nTh4tSh0uldB3V3ryS3cur3AndL0ng';

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
        // POST /register
        if (path.includes('/register') && method === 'POST') {
            const body = JSON.parse(event.body);
            const { username, email, password, bio } = body;
            
            // Validations
            if (!username || !email || !password) {
                return {
                    statusCode: 400,
                    headers,
                    body: JSON.stringify({ message: 'Faltan campos obligatorios' })
                };
            }
            
            // Check if user exists
            const existingUser = await dynamoDB.query({
                TableName: USERS_TABLE,
                IndexName: 'username-index',
                KeyConditionExpression: 'username = :username',
                ExpressionAttributeValues: {
                    ':username': username
                }
            }).promise();
            
            if (existingUser.Items && existingUser.Items.length > 0) {
                return {
                    statusCode: 400,
                    headers,
                    body: JSON.stringify({ message: 'El username ya existe' })
                };
            }
            
            // Create user
            const userId = Date.now().toString();
            const hashedPassword = await bcrypt.hash(password, 10);
            
            const newUser = {
                id: userId,
                username,
                email,
                password: hashedPassword,
                bio: bio || '',
                createdAt: new Date().toISOString(),
                activo: true
            };
            
            await dynamoDB.put({
                TableName: USERS_TABLE,
                Item: newUser
            }).promise();
            
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({ 
                    message: 'Usuario registrado exitosamente',
                    userId: userId
                })
            };
        }
        
        // POST /login
        if (path.includes('/login') && method === 'POST') {
            const body = JSON.parse(event.body);
            const { username, password } = body;
            
            if (!username || !password) {
                return {
                    statusCode: 400,
                    headers,
                    body: JSON.stringify({ message: 'Faltan credenciales' })
                };
            }
            
            // Find user
            const result = await dynamoDB.query({
                TableName: USERS_TABLE,
                IndexName: 'username-index',
                KeyConditionExpression: 'username = :username',
                ExpressionAttributeValues: {
                    ':username': username
                }
            }).promise();
            
            if (!result.Items || result.Items.length === 0) {
                return {
                    statusCode: 401,
                    headers,
                    body: JSON.stringify({ message: 'Credenciales inválidas' })
                };
            }
            
            const user = result.Items[0];
            
            // Verify password
            const validPassword = await bcrypt.compare(password, user.password);
            if (!validPassword) {
                return {
                    statusCode: 401,
                    headers,
                    body: JSON.stringify({ message: 'Credenciales inválidas' })
                };
            }
            
            // Generate JWT
            const token = jwt.sign(
                { id: user.id, username: user.username },
                JWT_SECRET,
                { expiresIn: '24h' }
            );
            
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                    token,
                    type: 'Bearer',
                    id: user.id,
                    username: user.username,
                    email: user.email
                })
            };
        }
        
        // GET /usuarios
        if (path.includes('/usuarios') && method === 'GET') {
            const result = await dynamoDB.scan({
                TableName: USERS_TABLE,
                ProjectionExpression: 'id, username, email, bio, createdAt'
            }).promise();
            
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify(result.Items)
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
