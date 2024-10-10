const { Telegraf, session } = require('telegraf');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Define the database file path
const dbPath = path.resolve(__dirname, 'users.db'); // Ensure this is your desired filename

// Connect to SQLite database
let db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error connecting to SQLite database:', err.message);
  } else {
    console.log('Connected to SQLite database.');
  }
});

// Create the users table
db.run(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    surname TEXT,
    subject TEXT,
    level TEXT,
    phoneNumber TEXT
  )
`, (err) => {
  if (err) {
    console.error('Error creating table:', err.message);
  } else {
    console.log('Users table created or already exists.');
  }
});

// Create the bot (replace 'YOUR_BOT_TOKEN' with your actual bot token)
const bot = new Telegraf('7242564026:AAGCpsJpig5v4DVdHscDxwzMuKmaL-93Vuw'); // Replace with your actual token

// Initialize session
bot.use(session({
  defaultSession: () => ({
    step: null,
    name: null,
    surname: null,
    subject: null,
    level: null
  })
}));

// Start command to begin the process
bot.start((ctx) => {
  ctx.session.step = null; // Reset step to allow re-navigating
  ctx.reply('Assalomu Alaykum! Tanlang:', {
    reply_markup: {
      keyboard: [
        [{ text: 'Ro\'yxatdan o\'tish' }, { text: 'Boshqa opsiya' }],
      ],
      resize_keyboard: true,
      one_time_keyboard: true
    }
  });
});

// Capture user inputs step by step
bot.on('text', (ctx) => {
  const text = ctx.message.text;
  const step = ctx.session.step;

  // Handle navigation choices
  if (text === 'Ro\'yxatdan o\'tish') {
    ctx.session.step = 'name'; // Set the first step for registration
    ctx.reply('Iltimos ismingizni kiriting:');
  } else if (text === 'Boshqa opsiya') {
    // Provide additional options or services
    ctx.reply('Bu yerda boshqa opsiyalar mavjud. Tanlang:', {
      reply_markup: {
        keyboard: [
          [{ text: 'Ta\'lim kurslari' }],
          [{ text: 'Biz bilan bog\'lanish' }],
          [{ text: 'Orqaga' }]
        ],
        resize_keyboard: true,
        one_time_keyboard: true
      }
    });
  } else if (step === 'name') {
    ctx.session.name = text;  // Store the user's name in session
    ctx.session.step = 'surname';  // Move to the next step
    ctx.reply('Yaxshi! Iltimos familiyangizni kiriting:');
  } else if (step === 'surname') {
    ctx.session.surname = text;
    ctx.session.step = 'subject';  // Move to subject selection
    ctx.reply('Fanni tanlang:', {
      reply_markup: {
        inline_keyboard: [
          [
            { text: 'Matematika', callback_data: 'math' },
            { text: 'Koreys tili', callback_data: 'korean' },
          ],
          [
            { text: 'Ingliz Tili', callback_data: 'english' },
            { text: 'Ona Tili', callback_data: 'onatili' },
          ],
          [
            { text: 'Tarix', callback_data: 'tarix' },
            { text: 'Biologiya', callback_data: 'biologiya' },
          ],
          [
            { text: 'Kimyo', callback_data: 'kimyo' },
            { text: 'IT', callback_data: 'IT' },
          ],
          [
            { text: 'Back', callback_data: 'back' }
          ]
        ]
      }
    });
  } else if (text === 'Ta\'lim kurslari') {
    ctx.reply('Bizda quyidagi ta\'lim kurslari mavjud:\n- Matematika\n- Koreys Tili\n- Ingliz Tili\n- Tarix\n\nQo\'shimcha ma\'lumot uchun biz bilan bog\'laning.');
    returnToMainMenu(ctx); // Return to main menu

  } else if (text === 'Biz bilan bog\'lanish') {
    ctx.reply('Biz bilan bog\'lanish uchun quyidagi raqamga murojaat qiling:\n\n📞 +998 99 123 45 67');
    returnToMainMenu(ctx); // Return to main menu

  } else if (text === 'Orqaga') {
    ctx.session.step = null; // Reset step to allow re-navigating
    returnToMainMenu(ctx); // Return to main menu
  }
});

// Handle subject selection
bot.action(['math', 'korean', 'english', 'onatili', 'tarix', 'biologiya', 'kimyo', 'IT'], (ctx) => {
  // Delete the previous message
  ctx.deleteMessage();

  // Set the subject based on the callback data
  const subjectMap = {
    math: 'Matematika',
    korean: 'Koreys Tili',
    english: 'Ingliz Tili',
    onatili: 'Ona Tili',
    tarix: 'Tarix',
    biologiya: 'Biologiya',
    kimyo: 'Kimyo',
    IT: 'IT'
  };

  ctx.session.subject = subjectMap[ctx.callbackQuery.data]; // Save subject
  ctx.session.step = 'level';  // Move to the next step
  ctx.reply(`Iltimos ${ctx.session.subject} fanidan bilim darajangizni tanlang:`, {
    reply_markup: {
      inline_keyboard: [
        [
          { text: 'Beginner', callback_data: 'beginner' },
          { text: 'Intermediate', callback_data: 'intermediate' },
          { text: 'Advanced', callback_data: 'advanced' }
        ],
        [
          { text: 'Back', callback_data: 'back' }
        ]
      ]
    }
  });
});

// Handle back action to return to subject selection
bot.action('back', (ctx) => {
  // Delete the previous message
  ctx.deleteMessage();

  ctx.session.step = 'surname';
  ctx.reply('Fanni tanlang:', {
    reply_markup: {
      inline_keyboard: [
        [
          { text: 'Matematika', callback_data: 'math' },
          { text: 'Koreys tili', callback_data: 'korean' },
        ],
        [
          { text: 'Ingliz Tili', callback_data: 'english' },
          { text: 'Ona Tili', callback_data: 'onatili' },
        ],
        [
          { text: 'Tarix', callback_data: 'tarix' },
          { text: 'Biologiya', callback_data: 'biologiya' },
        ],
        [
          { text: 'Kimyo', callback_data: 'kimyo' },
          { text: 'IT', callback_data: 'IT' },
        ]
      ]
    }
  });
});

// Handle level selection and ask for phone number
bot.action('beginner', (ctx) => {
  ctx.session.level = 'Beginner';
  ctx.session.step = 'phone';
  requestContactInfo(ctx);
});

bot.action('intermediate', (ctx) => {
  ctx.session.level = 'Intermediate';
  ctx.session.step = 'phone';
  requestContactInfo(ctx);
});

bot.action('advanced', (ctx) => {
  ctx.session.level = 'Advanced';
  ctx.session.step = 'phone';
  requestContactInfo(ctx);
});

// Function to request contact information
function requestContactInfo(ctx) {
  ctx.reply('Please share your contact information by clicking the "Share My Contact Info" button below:', {
    reply_markup: {
      keyboard: [
        [{ text: 'Share My Contact Info', request_contact: true }]
      ],
      one_time_keyboard: true,
      resize_keyboard: true
    }
  });
}

// Capture contact information and store in database
bot.on('contact', (ctx) => {
  const phoneNumber = ctx.message.contact ? ctx.message.contact.phone_number : null;

  if (phoneNumber) {
    console.log('Inserting data with session:', ctx.session);
    console.log('Phone number received:', phoneNumber);

    // Insert user data into SQLite database
    db.run(`INSERT INTO users (name, surname, subject, level, phoneNumber) VALUES (?, ?, ?, ?, ?)`,
      [ctx.session.name, ctx.session.surname, ctx.session.subject, ctx.session.level, phoneNumber],
      function(err) {
        if (err) {
          console.error('Error inserting data into database:', err.message);
          ctx.reply('Ma\'lumot saqlanayotganda xato yuz berdi.');
        } else {
          ctx.reply('Ro\'yxatdan o\'tdingiz! Barcha ma\'lumotlar saqlandi.');
          console.log(`User data inserted: ${this.lastID}`);
          ctx.session.step = null; // Reset step after registration
          returnToMainMenu(ctx); // Return to main menu after registration
        }
      }
    );
  } else {
    ctx.reply('Afsuski, sizning telefon raqamingizni olishda muammo bo\'ldi. Iltimos, yana urinib ko\'ring.');
    returnToMainMenu(ctx); // Return to main menu on error
  }
});

// Helper function to return to the main menu
function returnToMainMenu(ctx) {
  ctx.session.step = null; // Reset step to allow re-navigating
  ctx.reply('Assalomu Alaykum! Tanlang:', {
    reply_markup: {
      keyboard: [
        [{ text: 'Ro\'yxatdan o\'tish' }, { text: 'Boshqa opsiya' }],
      ],
      resize_keyboard: true,
      one_time_keyboard: true
    }
  });
}

// Start the bot
bot.launch().then(() => {
  console.log('Bot is running...');
});

// Handle errors
process.on('unhandledRejection', (error) => {
  console.error('Unhandled promise rejection:', error);
});
