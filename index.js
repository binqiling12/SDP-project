const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const bcrypt = require('bcrypt');

const app = express();

// Enhanced CORS configuration for Vite React
app.use(cors({
    origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
}));
app.use(express.json());

const dbConfig = {
    host: 'sql113.infinityfree.com',
    user: 'if0_38140143',
    password: 'mysdpproject1',
    database: 'd:\TGS KULIAH\Semester 5\code SDP final\backend_SDP'
};

async function queryDatabase(query, params) {
    const connection = await mysql.createConnection(dbConfig);
    try {
        const [results] = await connection.execute(query, params);
        return results;
    } finally {
        connection.end();
    }
}

// Role endpoint
app.post('/api/roles', async (req, res) => {
    const { role_name } = req.body;
    if (!role_name) {
        return res.status(400).json({ error: 'Role name is required' });
    }
    try {
        const result = await queryDatabase('INSERT INTO Role (role_name) VALUES (?)', [role_name]);
        res.status(201).json({ id: result.insertId, message: 'Role created successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// User endpoint
app.post('/api/users', async (req, res) => {
    const { username, password, email } = req.body;

    if (!username || !password || !email) {
        return res.status(400).json({
            status: 'error',
            message: 'Missing required fields'
        });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const userRoleId = 2;

        const result = await queryDatabase(
            'INSERT INTO User (username, password, email, role_id) VALUES (?, ?, ?, ?)',
            [username, hashedPassword, email, userRoleId]
        );

        res.status(201).json({
            status: 'success',
            message: 'User created successfully',
            data: {
                id: result.insertId,
                username,
                email,
                role_id: userRoleId
            }
        });
    } catch (err) {
        res.status(500).json({
            status: 'error',
            message: 'Failed to create user',
            error: err.message
        });
    }
});

// GET endpoint for users
app.get('/api/users', async (req, res) => {
    try {
        const results = await queryDatabase(`
            SELECT 
                User.user_id, 
                User.username, 
                User.email, 
                User.role_id, 
                Role.role_name 
            FROM User 
            LEFT JOIN Role ON User.role_id = Role.role_id
        `);

        res.status(200).json({
            status: 'success',
            data: results
        });
    } catch (err) {
        res.status(500).json({
            status: 'error',
            message: 'Failed to fetch users',
            error: err.message
        });
    }
});

// GET endpoint for a single user by username
app.get('/api/users/:username', async (req, res) => {
    const { username } = req.params;
    try {
        const results = await queryDatabase(`
            SELECT 
                User.user_id, 
                User.username, 
                User.password, 
                User.email, 
                User.role_id, 
                Role.role_name 
            FROM User 
            LEFT JOIN Role ON User.role_id = Role.role_id
            WHERE User.username = ?
        `, [username]);

        if (results.length > 0) {
            res.status(200).json({
                status: 'success',
                data: results[0]
            });
        } else {
            res.status(404).json({
                status: 'error',
                message: 'User not found'
            });
        }
    } catch (err) {
        res.status(500).json({
            status: 'error',
            message: 'Failed to fetch user',
            error: err.message
        });
    }
});

// Category endpoint
app.post('/api/categories', async (req, res) => {
    const { category_name } = req.body;
    if (!category_name) {
        return res.status(400).json({ error: 'Category name is required' });
    }
    try {
        const result = await queryDatabase('INSERT INTO Category (category_name) VALUES (?)', [category_name]);
        res.status(201).json({ id: result.insertId, message: 'Category created successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET endpoint for categories
app.get('/api/categories', async (req, res) => {
    try {
        const results = await queryDatabase('SELECT * FROM Category', []);
        res.status(200).json({
            status: 'success',
            data: results
        });
    } catch (err) {
        res.status(500).json({
            status: 'error',
            message: 'Failed to fetch categories',
            error: err.message
        });
    }
});

// Product endpoint
app.post('/api/products', async (req, res) => {
    const { name, stock, price, image, description, category_id } = req.body;

    if (!name || !price || stock === undefined || !category_id) {
        return res.status(400).json({
            status: 'error',
            message: 'Missing required fields'
        });
    }

    try {
        // Validate category_id
        const [categories] = await queryDatabase('SELECT category_id FROM Category WHERE category_id = ?', [category_id]);
        if (categories.length === 0) {
            return res.status(400).json({
                status: 'error',
                message: 'Invalid category ID'
            });
        }

        const result = await queryDatabase(
            'INSERT INTO Product (name, stock, price, image, description, category_id) VALUES (?, ?, ?, ?, ?, ?)',
            [name, stock, price, image, description, category_id]
        );
        res.status(201).json({
            status: 'success',
            message: 'Product created successfully',
            data: {
                id: result.insertId,
                name,
                stock,
                price,
                image,
                description,
                category_id
            }
        });
    } catch (err) {
        res.status(500).json({
            status: 'error',
            message: 'Failed to create product',
            error: err.message
        });
    }
});

// GET endpoint for products
app.get('/api/products', async (req, res) => {
    try {
        const results = await queryDatabase('SELECT * FROM Product', []);
        res.status(200).json({
            status: 'success',
            data: results.map(product => ({
                ...product,
                id: product.product_id // Ensure each product has a unique id
            }))
        });
    } catch (err) {
        res.status(500).json({
            status: 'error',
            message: 'Failed to fetch products',
            error: err.message
        });
    }
});

// Add this new endpoint for getting a single product
app.get('/api/products/:productId', async (req, res) => {
    const productId = req.params.productId;
    try {
        const results = await queryDatabase(
            'SELECT * FROM Product WHERE product_id = ?', 
            [productId]
        );
        if (results.length > 0) {
            res.status(200).json({
                status: 'success',
                data: {
                    ...results[0],
                    id: results[0].product_id
                }
            });
        } else {
            res.status(404).json({
                status: 'error',
                message: 'Product not found'
            });
        }
    } catch (err) {
        res.status(500).json({
            status: 'error',
            message: 'Failed to fetch product',
            error: err.message
        });
    }
});

// DELETE endpoint for products
app.delete('/api/products/:id', async (req, res) => {
    const productId = req.params.id;
    try {
        await queryDatabase('DELETE FROM Product WHERE product_id = ?', [productId]);
        res.status(200).json({
            status: 'success',
            message: 'Product deleted successfully'
        });
    } catch (err) {
        res.status(500).json({
            status: 'error',
            message: 'Failed to delete product',
            error: err.message
        });
    }
});

// PUT endpoint for products
app.put('/api/products/:id', async (req, res) => {
    const productId = req.params.id;
    const { name, stock, price, image, description, category_id } = req.body;

    try {
        // Validate category_id
        const [categories] = await queryDatabase('SELECT category_id FROM Category WHERE category_id = ?', [category_id]);
        if (categories.length === 0) {
            return res.status(400).json({
                status: 'error',
                message: 'Invalid category ID'
            });
        }

        await queryDatabase(
            'UPDATE Product SET name = ?, stock = ?, price = ?, image = ?, description = ?, category_id = ? WHERE product_id = ?',
            [name, stock, price, image, description, category_id, productId]
        );
        res.status(200).json({
            status: 'success',
            message: 'Product updated successfully',
            data: {
                product_id: productId,
                name,
                stock,
                price,
                image,
                description,
                category_id
            }
        });
    } catch (err) {
        res.status(500).json({
            status: 'error',
            message: 'Failed to update product',
            error: err.message
        });
    }
});

// ProductCategory endpoint
app.post('/api/product-categories', async (req, res) => {
    const { product_id, category_id } = req.body;

    if (!product_id || !category_id) {
        return res.status(400).json({ error: 'Product ID and Category ID are required' });
    }

    try {
        await queryDatabase('INSERT INTO ProductCategory (product_id, category_id) VALUES (?, ?)', [product_id, category_id]);
        res.status(201).json({ message: 'Product category mapping created successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Cart endpoint
app.post('/api/carts', async (req, res) => {
    const { user_id, total_price } = req.body;

    if (!user_id || !total_price) {
        return res.status(400).json({ error: 'User ID and total price are required' });
    }

    try {
        // Check if a cart already exists for the user
        const existingCart = await queryDatabase('SELECT cart_id FROM Cart WHERE user_id = ?', [user_id]);
        if (existingCart.length > 0) {
            return res.status(200).json({ id: existingCart[0].cart_id, message: 'Cart already exists' });
        }

        // If no existing cart, create a new one
        const result = await queryDatabase('INSERT INTO Cart (user_id, total_price) VALUES (?, ?)', [user_id, total_price]);
        res.status(201).json({ id: result.insertId, message: 'Cart created successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET endpoint for cart items by user ID
app.get('/api/cart/:userId', async (req, res) => {
    const userId = req.params.userId;
    try {
        const results = await queryDatabase(`
            SELECT 
                CartItem.cart_item_id,
                CartItem.quantity,
                Product.product_id,
                Product.name,
                Product.price,
                Product.image,
                Product.description
            FROM CartItem
            JOIN Cart ON CartItem.cart_id = Cart.cart_id
            JOIN Product ON CartItem.product_id = Product.product_id
            WHERE Cart.user_id = ?
        `, [userId]);

        res.status(200).json(results);
    } catch (err) {
        res.status(500).json({
            status: 'error',
            message: 'Failed to fetch cart items',
            error: err.message
        });
    }
});

// CartItem endpoint
app.post('/api/cart-items', async (req, res) => {
    const { cart_id, product_id, quantity } = req.body;

    if (!cart_id || !product_id || quantity === undefined) {
        return res.status(400).json({ error: 'Cart ID, Product ID, and quantity are required' });
    }

    try {
        const result = await queryDatabase(
            'INSERT INTO CartItem (cart_id, product_id, quantity) VALUES (?, ?, ?)',
            [cart_id, product_id, quantity]
        );
        res.status(201).json({ id: result.insertId, message: 'Cart item created successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Transaction endpoint
app.post('/api/transactions', async (req, res) => {
    const { user_id, status, total_amount } = req.body;

    if (!user_id || !status || total_amount === undefined) {
        return res.status(400).json({ error: 'User ID, status, and total amount are required' });
    }

    try {
        const result = await queryDatabase(
            'INSERT INTO Transaction (user_id, status, total_amount) VALUES (?, ?, ?, ?, ?)', // Added payment_method, virtual_account, and payment_expiry
            [user_id, status, total_amount]
        );
        res.status(201).json({ id: result.insertId, message: 'Transaction created successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET endpoint for all transactions
app.get('/api/transactions', async (req, res) => {
    try {
        const results = await queryDatabase(`
            SELECT 
                Transaction.transaction_id,
                Transaction.user_id,
                Transaction.status,
                Transaction.total_amount,
                DATE_FORMAT(Transaction.transaction_time, '%Y-%m-%d %H:%i:%s') AS transaction_time,
                User.username
            FROM Transaction
            JOIN User ON Transaction.user_id = User.user_id
        `);

        res.status(200).json(results);
    } catch (err) {
        res.status(500).json({
            status: 'error',
            message: 'Failed to fetch transactions',
            error: err.message
        });
    }
});

// GET endpoint for user transactions with details
app.get('/api/transactions/user/:userId', async (req, res) => {
    const userId = req.params.userId;
    try {
        const results = await queryDatabase(`
            SELECT 
                t.transaction_id,
                t.status,
                t.total_amount,
                DATE_FORMAT(t.transaction_time, '%Y-%m-%d %H:%i:%s') AS transaction_time,
                t.payment_method,
                ti.quantity,
                ti.price_at_purchase,
                p.name as product_name,
                p.image as product_image
            FROM Transaction t
            JOIN TransactionItem ti ON t.transaction_id = ti.transaction_id
            JOIN Product p ON ti.product_id = p.product_id
            WHERE t.user_id = ?
            ORDER BY t.transaction_time DESC
        `, [userId]);

        // Group items by transaction
        const groupedTransactions = results.reduce((acc, item) => {
            const transaction = acc.find(t => t.transaction_id === item.transaction_id);
            
            if (transaction) {
                transaction.items.push({
                    product_name: item.product_name,
                    product_image: item.product_image,
                    quantity: item.quantity,
                    price: item.price_at_purchase
                });
            } else {
                acc.push({
                    transaction_id: item.transaction_id,
                    status: item.status,
                    total_amount: item.total_amount,
                    transaction_time: item.transaction_time,
                    payment_method: item.payment_method,
                    items: [{
                        product_name: item.product_name,
                        product_image: item.product_image,
                        quantity: item.quantity,
                        price: item.price_at_purchase
                    }]
                });
            }
            return acc;
        }, []);

        res.status(200).json(groupedTransactions);
    } catch (err) {
        res.status(500).json({
            status: 'error',
            message: 'Failed to fetch user transactions',
            error: err.message
        });
    }
});

// TransactionItem endpoint
app.post('/api/transaction-items', async (req, res) => {
    const { transaction_id, product_id, quantity, price_at_purchase } = req.body;

    if (!transaction_id || !product_id || quantity === undefined || price_at_purchase === undefined) {
        return res.status(400).json({ error: 'Transaction ID, Product ID, quantity, and price at purchase are required' });
    }

    try {
        const result = await queryDatabase(
            'INSERT INTO TransactionItem (transaction_id, product_id, quantity, price_at_purchase) VALUES (?, ?, ?, ?, ?)',
            [transaction_id, product_id, quantity, price_at_purchase]
        );
        res.status(201).json({ id: result.insertId, message: 'Transaction item created successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Function to generate virtual account number
function generateVirtualAccount() {
    const prefix = '88808'; // BCA VA prefix
    const random = Math.floor(Math.random() * 1000000000).toString().padStart(9, '0');
    return prefix + random;
}

// Modify the process-payment endpoint
app.post('/api/process-payment', async (req, res) => {
    const { userId, items, totalAmount, paymentMethod, shouldUpdateStock, shouldClearCart } = req.body;
    
    let connection;
    try {
        connection = await mysql.createConnection({
            ...dbConfig,
            multipleStatements: true
        });
        await connection.beginTransaction();

        // Generate Virtual Account and expiry time for BCA payments
        let virtualAccount = null;
        let paymentExpiry = null;
        let transactionStatus = shouldUpdateStock ? 'completed' : 'awaiting_payment';

        if (paymentMethod === 'bca' && !shouldUpdateStock) {
            virtualAccount = generateVirtualAccount();
            // Set payment expiry to 1 hour from now
            paymentExpiry = new Date(Date.now() + 3600000).toISOString().slice(0, 19).replace('T', ' ');
        }

        // Create transaction record with virtual account and expiry
        const [transactionResult] = await connection.execute(
            'INSERT INTO `Transaction` (user_id, status, total_amount, payment_method, virtual_account, payment_expiry) VALUES (?, ?, ?, ?, ?, ?)', 
            [userId, transactionStatus, totalAmount, paymentMethod, virtualAccount, paymentExpiry]
        );
        
        // Process items and update stock if needed
        for (const item of items) {
            if (shouldUpdateStock) {
                const [stockResult] = await connection.execute(
                    'SELECT stock FROM Product WHERE product_id = ?',
                    [item.product_id]
                );

                if (!stockResult.length || stockResult[0].stock < item.quantity) {
                    throw new Error(`Insufficient stock for product ID ${item.product_id}`);
                }

                await connection.execute(
                    'UPDATE Product SET stock = stock - ? WHERE product_id = ?',
                    [item.quantity, item.product_id]
                );
            }

            await connection.execute(
                'INSERT INTO TransactionItem (transaction_id, product_id, quantity, price_at_purchase) VALUES (?, ?, ?, ?)', 
                [transactionResult.insertId, item.product_id, item.quantity, item.price]
            );
        }

        // Clear cart after successful transaction processing
        if (shouldClearCart) {
            const [userCarts] = await connection.execute(
                'SELECT cart_id FROM Cart WHERE user_id = ?',
                [userId]
            );

            for (const cart of userCarts) {
                // Delete all cart items first
                await connection.execute(
                    'DELETE FROM CartItem WHERE cart_id = ?',
                    [cart.cart_id]
                );
                
                // Reset cart total
                await connection.execute(
                    'UPDATE Cart SET total_price = 0 WHERE cart_id = ?',
                    [cart.cart_id]
                );
            }
        }

        await connection.commit();
        
        res.status(200).json({
            status: 'success',
            message: 'Payment processed successfully',
            transactionId: transactionResult.insertId,
            virtualAccount,
            paymentExpiry,
            paymentStatus: transactionStatus
        });

    } catch (err) {
        if (connection) await connection.rollback();
        res.status(500).json({
            status: 'error',
            message: err.message || 'Failed to process payment'
        });
    } finally {
        if (connection) await connection.end();
    }
});

// Add endpoint to confirm BCA payment
app.post('/api/confirm-bca-payment', async (req, res) => {
    const { transactionId, virtualAccount } = req.body;
    
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        
        // Verify transaction exists and is valid
        const [transaction] = await connection.execute(
            'SELECT * FROM Transaction WHERE transaction_id = ? AND virtual_account = ? AND status = "awaiting_payment" AND payment_expiry > NOW()',
            [transactionId, virtualAccount]
        );

        if (transaction.length === 0) {
            return res.status(400).json({
                status: 'error',
                message: 'Invalid transaction or payment expired'
            });
        }

        // Update transaction status and process stock updates
        await connection.beginTransaction();

        // Update transaction status
        await connection.execute(
            'UPDATE Transaction SET status = "completed" WHERE transaction_id = ?',
            [transactionId]
        );

        // Update product stock
        const [items] = await connection.execute(
            'SELECT * FROM TransactionItem WHERE transaction_id = ?',
            [transactionId]
        );

        for (const item of items) {
            await connection.execute(
                'UPDATE Product SET stock = stock - ? WHERE product_id = ?',
                [item.quantity, item.product_id]
            );
        }

        await connection.commit();

        res.status(200).json({
            status: 'success',
            message: 'Payment confirmed successfully'
        });

    } catch (err) {
        if (connection) await connection.rollback();
        res.status(500).json({
            status: 'error',
            message: err.message
        });
    } finally {
        if (connection) await connection.end();
    }
});

// Add scheduled task to check expired payments
setInterval(async () => {
    try {
        const connection = await mysql.createConnection(dbConfig);
        await connection.execute(`
            UPDATE Transaction 
            SET status = 'failed' 
            WHERE status = 'awaiting_payment' 
            AND payment_expiry < NOW()
        `);
        connection.end();
    } catch (err) {
        console.error('Error checking expired payments:', err);
    }
}, 60000); // Check every minute

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        status: 'error',
        message: 'Internal server error',
        error: err.message
    });
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`Vite React app should be running on http://localhost:5173`);
});
