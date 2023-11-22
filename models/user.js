/** User class for message.ly */

const db = require('../db');
const bcrypt = require('bcrypt');
const ExpressError = require('../expressError');
const { BCRYPT_WORK_FACTOR } = require('../config');

/** User of the site. */
class User {
    /** register new user -- returns
     *    {username, password, first_name, last_name, phone}
     */

    static async register({
        username,
        password,
        first_name,
        last_name,
        phone,
    }) {
        const hashedPassword = await bcrypt.hash(password, BCRYPT_WORK_FACTOR);
        const result = await db.query(
            `
            INSERT INTO users (username, password, first_name, last_name, phone, join_at)
            VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
            RETURNING username, password, first_name, last_name, phone
            `,
            [username, hashedPassword, first_name, last_name, phone]
        );

        return result.rows[0];
    }

    /** Authenticate: is this username/password valid? Returns boolean. */
    static async authenticate(username, password) {
        const result = await db.query(
            `
            SELECT * FROM users
            WHERE username = $1
            `,
            [username]
        );

        const user = result.rows[0];

        if (await bcrypt.compare(password, user.password)) {
            return true;
        }

        return false;
    }

    /** Update last_login_at for user */
    static async updateLoginTimestamp(username) {
        const result = await db.query(
            `
            UPDATE users
            SET last_login_at = CURRENT_TIMESTAMP
            WHERE username = $1
            RETURNING last_login_at
            `,
            [username]
        );

        const user = result.rows[0];

        if (!user) {
            throw new ExpressError(
                `The user with the username '${username}' does not exist!`,
                404
            );
        }

        return user.last_login_at;
    }

    /** All: basic info on all users:
     * [{username, first_name, last_name, phone}, ...] */
    static async all() {}

    /** Get: get user by username
     *
     * returns {username,
     *          first_name,
     *          last_name,
     *          phone,
     *          join_at,
     *          last_login_at } */
    static async get(username) {
        const result = await db.query(
            `
            SELECT * FROM users
            WHERE username = $1
            `,
            [username]
        );

        const user = result.rows[0];

        if (!user) {
            throw new ExpressError(
                `The user with the username '${username}' does not exist!`,
                404
            );
        }

        return user;
    }

    /** Return messages from this user.
     *
     * [{id, to_user, body, sent_at, read_at}]
     *
     * where to_user is
     *   {username, first_name, last_name, phone}
     */
    static async messagesFrom(username) {}

    /** Return messages to this user.
     *
     * [{id, from_user, body, sent_at, read_at}]
     *
     * where from_user is
     *   {username, first_name, last_name, phone}
     */
    static async messagesTo(username) {}
}

module.exports = User;
