import bcrypt from 'bcrypt';
import { db } from './db.server';
import type { Request } from '@remix-run/node';
import { createCookieSessionStorage } from '@remix-run/node';
import { redirect } from 'react-router';


// Register new user
export async function register({username, password}: any) {
    const passwordHash = await bcrypt.hash(password, 10);
    return db.user.create({
        data: {
            username,
            passwordHash
        }
    });
}

// login user
export async function login({username, password}: any) {
    const user = await db.user.findUnique({
        where: {
            username
        }
    });
    if (!user) return null;
    
    const isCorrectPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isCorrectPassword) return null;
    return user;
}

// get session secret
const sessionSecret = process.env.SESSION_SECRET;
if (!sessionSecret) {
    throw new Error('No Session Secret');
}

// create session storage
const storage = createCookieSessionStorage({
    cookie: {
        name: 'remixblog_session',
        secure: process.env.NODE_ENV === 'production',
        secrets: [sessionSecret],
        sameSite: 'lax',
        path: '/',
        maxAge: 60*60*24*60,
        httpOnly: true
    }
})

// create session
export async function createUserSession(userId: string, redirectTo: string) {
    const session = await storage.getSession();
    session.set('userId', userId);
    return redirect(redirectTo, {
        headers: {'Set-Cookie': await storage.commitSession(session)}
    })
}

// Get user session
export function getUserSession(request: Request) {
    return storage.getSession(request.headers.get('Cookie'));
}

// Get logged in user
export async function getUser(request: Request) {
    const session = await getUserSession(request);
    const userId = session.get('userId');
    if (!userId || typeof userId !== 'string') {
        return null;
    }
    try {
        const user = await db.user.findUnique({
            where: { id: userId }
        });
        return user;
    } catch (error) {
        return null
    }
}

// logout user and clear session
export async function logout(request: Request) {
    const session = await storage.getSession(request.headers.get('Cookie'));
    return redirect('/auth/logout', {
        headers: {
            'Set-Cookie': await storage.destroySession(session)
        }
    })
}

