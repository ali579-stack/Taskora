TASKORA/

├── index.html

├── dashboard/
│   └── dashboard.html

├── admin/
│   ├── admin-login.html
│   └── admin.html


├── assets/
│   ├── css/
│   │   └── style.css
│   │
│   └── js/
│       ├── config.js
│       ├── auth.js
│       ├── login.js
│       ├── withdrawals.js
│       ├── admin-finance.js
│       └── admin-withdrawals.js


└── backend/

    ├── package.json
    ├── server.js
    ├── .env

    ├── database/
    │   ├── schema.sql
    │   ├── seed.js
    │   └── seed-data.js
    │
    └── src/
        ├── db.js
        │
        ├── middleware/
        │   └── auth.js
        │
        └── routes/
            ├── auth.js
            ├── tasks.js
            ├── withdrawals.js
            └── admin.js