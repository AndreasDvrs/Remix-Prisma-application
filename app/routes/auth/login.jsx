import { json } from "@remix-run/node";
import { useActionData } from "@remix-run/react";
import { db } from '~/utils/db.server';
import { login, createUserSession, register } from '~/utils/session.server';

function badRequest(data) {
    return json(data, {status: 400});
}

function validateUsername (username) {
    if (typeof username !== 'string' || (username.length < 3)) {
        return 'username should be a t least 3 chars long'
    }
}

function validatePassword (password) {
    if (typeof password !== 'string' || password.length<5) {
        return 'password should be a t least 5 chars long'
    }
}

export const action = async ({request}) => {
    const form = await request.formData();

    const loginType = form.get('loginType');
    const username = form.get('username');
    const password = form.get('password');

    const fields = {loginType, username, password}

    const fieldErrors = {
        username: validateUsername(username),
        password: validatePassword(password)
    }

    if (Object.values(fieldErrors).some(Boolean)) {
        console.log(fieldErrors);
        return badRequest({fieldErrors, fields});
    }

    switch(loginType) {
        case 'login': {
            // find user
            // check user pass
            const user = await login({username, password});
            if (!user) return badRequest({
                fields, 
                fieldErrors: {username: 'Invalid Credentials'} 
            });
            //create user session
            return createUserSession(user.id, '/posts');

        }
        case 'register': {
            // check if user exists
            const userExists = await db.user.findFirst({
                where: { username}
            });
            if (userExists) return badRequest({
                fields,
                fieldErrors: {username: `User ${username} already exists`}
            });
            const user = await register({username, password});
            if (!user) return badRequest({
                fields,
                formError: 'Something went wrong' 
            })
            // create user pass
            // create user session
            return createUserSession(user.id, '/posts')
        }
        default: {
            return badRequest({
                fields,
                formError: 'Login type is not valid'
            })
        }

    }

}


function Login() {
    const actionData = useActionData();
    
  return (
    <div className='auth-container'>
        <div className="page-header">
            <h1>Login</h1>
        </div>
        <div className="page-content">
            <form method="POST">
                <fieldset>
                    <legend>Login or Register</legend>
                    <label>
                        <input type="radio" name="loginType" value='login' defaultChecked={!actionData?.fields?.loginType || actionData?.fields?.loginType === 'login'}/> Login
                    </label>
                    <label>
                        <input type="radio" name="loginType" value='register'/> Register
                    </label>
                </fieldset>
                <div className="form-control">
                    <label htmlFor="username">Username</label>
                    <input type="text" name='username' id='username' defaultValue={actionData?.fields?.username ?? '' }></input>
                    <div className="error">{actionData?.fieldErrors?.username ?? '' }</div>
                </div>
                <div className="form-control">
                    <label htmlFor="password">Password</label>
                    <input type="password" name='password' id='password' defaultValue={actionData?.fields?.password ?? '' }></input>
                    <div className="error">{actionData?.fieldErrors?.password ?? '' }</div>
                </div>
                <button className="btn btn-block" type="submit">
                    Submit
                </button>
            </form>
        </div>
    </div>
  )
}

export default Login;
