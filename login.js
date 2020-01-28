const fetch = require('node-fetch');

async function login(url, username, password) {
    return fetch(url, {
        method: 'POST',
        body: JSON.stringify({ 'username': username, 'password': password }),
    }).then(response => {
        if (response.ok) {
            return response.json();
        }
        return null;
    });
};

module.exports = login;
