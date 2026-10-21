import readlineSync from 'readline-sync';
import db from './db.js';

let currentUser = null;

// ==========================================
// READER FUNCTIONS
// ==========================================

async function allBlog() {
  try {
    const [rows] = await db.query(
      `SELECT b.id, b.blogTitle, b.category, b.blog, b.createdAt, 
              CONCAT(u.firstname, ' ', u.lastname) AS author 
       FROM blogs b 
       JOIN users u ON b.userId = u.id`
    );

    console.log('\n================ ALL BLOGS ================');
    if (rows.length === 0) {
      console.log('No blogs available.');
    } else {
      console.table(rows);
    }
  } catch (error) {
    console.error('Error fetching blogs:', error.message);
  }
}

// ==========================================
// ADMIN FUNCTIONS
// ==========================================

async function allUsers() {
  try {
    const [rows] = await db.query(
      `SELECT id, firstname, lastname, email, isActive, role, createdAt FROM users`
    );
    console.log('\n================ ALL USERS ================');
    console.table(rows);
  } catch (error) {
    console.error('Error fetching users:', error.message);
  }
}

async function allUsersBlog() {
  await allBlog();
}

async function updateUserActiveStatus() {
  const userId = readlineSync.question('Enter User ID to update status: ');
  const statusInput = readlineSync.question('Set isActive status (true/false): ');
  const isActive = statusInput.trim().toLowerCase() === 'true' ? 1 : 0;

  try {
    const [result] = await db.query(
      `UPDATE users SET isActive = ? WHERE id = ?`,
      [isActive, userId]
    );

    if (result.affectedRows > 0) {
      console.log(`User ID ${userId} status updated successfully.`);
    } else {
      console.log('User not found.');
    }
  } catch (error) {
    console.error('Error updating user status:', error.message);
  }
}

async function deleteUser() {
  const userId = readlineSync.question('Enter User ID to delete: ');
  try {
    const [result] = await db.query(`DELETE FROM users WHERE id = ?`, [userId]);
    if (result.affectedRows > 0) {
      console.log(`User ID ${userId} deleted successfully.`);
    } else {
      console.log('User not found.');
    }
  } catch (error) {
    console.error('Error deleting user:', error.message);
  }
}

async function adminDeleteBlog() {
  const blogId = readlineSync.question('Enter Blog ID to delete: ');
  try {
    const [result] = await db.query(`DELETE FROM blogs WHERE id = ?`, [blogId]);
    if (result.affectedRows > 0) {
      console.log(`Blog ID ${blogId} deleted successfully.`);
    } else {
      console.log('Blog not found.');
    }
  } catch (error) {
    console.error('Error deleting blog:', error.message);
  }
}

// ==========================================
// USER FUNCTIONS
// ==========================================

async function viewYourBlogs() {
  try {
    const [rows] = await db.query(
      `SELECT id, blogTitle, category, createdAt FROM blogs WHERE userId = ?`,
      [currentUser.id]
    );

    console.log('\n================ YOUR BLOGS ================');
    if (rows.length === 0) {
      console.log('No blogs are found');
    } else {
      console.table(rows);
    }
  } catch (error) {
    console.error('Error fetching your blogs:', error.message);
  }
}

async function createBlog() {
  console.log('\n--- Create New Blog ---');
  const blogTitle = readlineSync.question('Blog Title: ');
  const blogContent = readlineSync.question('Blog Content: ');
  const category = readlineSync.question('Category: ');

  try {
    await db.query(
      `INSERT INTO blogs (userId, blogTitle, blog, category) VALUES (?, ?, ?, ?)`,
      [currentUser.id, blogTitle, blogContent, category]
    );
    console.log('Blog created successfully!');
  } catch (error) {
    console.error('Error creating blog:', error.message);
  }
}

async function searchBlog() {
  const searchQuery = readlineSync.question('Enter Blog ID or Title to Search: ');

  try {
    const [rows] = await db.query(
      `SELECT b.id, b.blogTitle, b.category, b.blog, b.createdAt, 
              CONCAT(u.firstname, ' ', u.lastname) AS author 
       FROM blogs b
       JOIN users u ON b.userId = u.id
       WHERE b.id = ? OR b.blogTitle LIKE ?`,
      [searchQuery, `%${searchQuery}%`]
    );

    console.log('\n================ SEARCH RESULTS ================');
    if (rows.length === 0) {
      console.log('No matching blog found.');
    } else {
      console.table(rows);
    }
  } catch (error) {
    console.error('Error searching blog:', error.message);
  }
}

async function updateBlog() {
  const blogId = readlineSync.question('Enter Blog ID to Update: ');

  try {
    // Admin can update any blog; regular user can only update their own
    const sqlCheck = currentUser.role === 'admin'
      ? `SELECT * FROM blogs WHERE id = ?`
      : `SELECT * FROM blogs WHERE id = ? AND userId = ?`;
    const paramsCheck = currentUser.role === 'admin' ? [blogId] : [blogId, currentUser.id];

    const [blogs] = await db.query(sqlCheck, paramsCheck);

    if (blogs.length === 0) {
      console.log('Blog not found or permission denied.');
      return;
    }

    const currentBlog = blogs[0];
    console.log(`Updating Blog: "${currentBlog.blogTitle}" (Press Enter to keep existing value)`);

    const blogTitle = readlineSync.question(`New Title [${currentBlog.blogTitle}]: `) || currentBlog.blogTitle;
    const blogContent = readlineSync.question(`New Content [${currentBlog.blog}]: `) || currentBlog.blog;
    const category = readlineSync.question(`New Category [${currentBlog.category}]: `) || currentBlog.category;

    await db.query(
      `UPDATE blogs SET blogTitle = ?, blog = ?, category = ? WHERE id = ?`,
      [blogTitle, blogContent, category, blogId]
    );
    console.log('Blog updated successfully!');
  } catch (error) {
    console.error('Error updating blog:', error.message);
  }
}

async function deleteBlog() {
  const blogId = readlineSync.question('Enter Blog ID to Delete: ');

  try {
    const [result] = await db.query(
      `DELETE FROM blogs WHERE id = ? AND userId = ?`,
      [blogId, currentUser.id]
    );

    if (result.affectedRows > 0) {
      console.log('Blog deleted successfully.');
    } else {
      console.log('Blog not found or permission denied.');
    }
  } catch (error) {
    console.error('Error deleting blog:', error.message);
  }
}

// ==========================================
// AUTHENTICATION
// ==========================================

async function register() {
  console.log('\n--- Register New Account ---');
  const firstname = readlineSync.question('First Name: ');
  const lastname = readlineSync.question('Last Name: ');
  const email = readlineSync.question('Email: ');
  const password = readlineSync.question('Password: ', { hideEchoBack: true });

  try {
    await db.query(
      `INSERT INTO users (firstname, lastname, email, password) VALUES (?, ?, ?, ?)`,
      [firstname, lastname, email, password]
    );
    console.log('Registration successful! You can now log in.');
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      console.log('Email already registered.');
    } else {
      console.error('Registration failed:', error.message);
    }
  }
}

async function login() {
  console.log('\n--- Login ---');
  const email = readlineSync.question('Email: ');
  const password = readlineSync.question('Password: ', { hideEchoBack: true });

  try {
    const [rows] = await db.query(
      `SELECT * FROM users WHERE email = ? AND password = ?`,
      [email, password]
    );

    if (rows.length === 0) {
      console.log('Invalid email or password.');
      return false;
    }

    const user = rows[0];

    // Check account status
    if (!user.isActive) {
      console.log('User is deactivated');
      return false;
    }

    currentUser = user;
    console.log(`\nWelcome back, ${currentUser.firstname}! (${currentUser.role.toUpperCase()})`);
    return true;
  } catch (error) {
    console.error('Login error:', error.message);
    return false;
  }
}

// ==========================================
// NAVIGATION MENUS
// ==========================================

async function userMenu() {
  let exit = false;
  while (!exit) {
    console.log('\n========== USER CONSOLE MENU ==========');
    console.log('1. View Your Blogs');
    console.log('2. Search Blog by ID/Title');
    console.log('3. Create Blog');
    console.log('4. Update Blog');
    console.log('5. Delete Blog');
    console.log('6. Logout');

    const choice = readlineSync.question('Select an option (1-6): ');

    switch (choice.trim()) {
      case '1':
        await viewYourBlogs();
        break;
      case '2':
        await searchBlog();
        break;
      case '3':
        await createBlog();
        break;
      case '4':
        await updateBlog();
        break;
      case '5':
        await deleteBlog();
        break;
      case '6':
        currentUser = null;
        console.log('Logged out successfully.');
        exit = true;
        break;
      default:
        console.log('Invalid option.');
    }
  }
}

async function adminMenu() {
  let exit = false;
  while (!exit) {
    console.log('\n========== ADMIN CONSOLE MENU ==========');
    console.log('1. View All Users');
    console.log('2. View All Blogs');
    console.log('3. Search Blog by ID/Title');
    console.log('4. Update User');
    console.log('5. Delete User');
    console.log('6. Delete Blog');
    console.log('7. Logout');

    const choice = readlineSync.question('Select an option (1-7): ');

    switch (choice.trim()) {
      case '1':
        await allUsers();
        break;
      case '2':
        await allUsersBlog();
        break;
      case '3':
        await searchBlog();
        break;
      case '4':
        await updateUserActiveStatus();
        break;
      case '5':
        await deleteUser();
        break;
      case '6':
        await adminDeleteBlog();
        break;
      case '7':
        currentUser = null;
        console.log('Logged out successfully.');
        exit = true;
        break;
      default:
        console.log('Invalid option.');
    }
  }
}

async function main() {
  console.log('========================================');
  console.log('   WELCOME TO THE BLOG DATABASE SYSTEM  ');
  console.log('========================================');

  while (true) {
    console.log('\n--- MAIN MENU ---');
    console.log('1. View All Blogs');
    console.log('2. Login');
    console.log('3. Register');
    console.log('4. Exit');

    const choice = readlineSync.question('Select an option (1-4): ');

    switch (choice.trim()) {
      case '1':
        await allBlog();
        break;
      case '2':
        const loggedIn = await login();
        if (loggedIn) {
          if (currentUser.role === 'admin') {
            await adminMenu();
          } else {
            await userMenu();
          }
        }
        break;
      case '3':
        await register();
        break;
      case '4':
        console.log('Goodbye!');
        process.exit(0);
      default:
        console.log('Invalid option.');
    }
  }
}

main().catch(err => console.error('Fatal error:', err));