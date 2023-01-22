import { redirect, json } from '@remix-run/node';
import { Link, useActionData } from '@remix-run/react';
import { db } from '~/utils/db.server';
import { getUser } from '~/utils/session.server';


function validateTitle (title) {
    if (typeof title !== 'string' || (title.length < 3)) {
        return 'Title should be a t least 3 chars long'
    }
}

function validateBody (body) {
    if (typeof body !== 'string' || body.length<10) {
        return 'Body should be a t least 10 chars long'
    }
}

export const action = async ({request}) => {
    const form = await request.formData()
    const title = form.get('title')
    const body = form.get('body')
    const user = await getUser(request);

    const fields = { title, body }

    const fieldErrors = {
        title: validateTitle(title),
        body: validateBody(body)
    }

    if (Object.values(fieldErrors).some(Boolean)) {
        console.log(fieldErrors);
        return json({fieldErrors, fields}, {status: 400});
    }

    const post = await db.post.create({data: {
        ...fields,
        userId: user.id
    }});
    
    return redirect(`/posts/${post.id}`);
}

function NewPost() {

    const actionData = useActionData();

  return (
    <>
        <div className="page-header">
            <h1>New Post</h1>
            <Link to='/posts' className="btn btn-reverse">Back</Link>
        </div>
        <div className="page-content">
            <form method='POST'>
                <div className="form-control">
                    <label htmlFor="title">Title</label>
                    <input type="text" name='title' id='title' defaultValue={actionData?.fields?.title}></input>
                    <div className="error">
                        <p>{actionData?.fieldErrors?.title && actionData?.fieldErrors?.title }</p>
                    </div>
                </div>
                <div className="form-control">
                    <label htmlFor="body">Post Body</label>
                    <div className="error">
                        <p>{actionData?.fieldErrors?.body && actionData?.fieldErrors?.body }</p>
                    </div>
                    <textarea name='body' id='body' defaultValue={actionData?.fields?.body}/>
                    <button type='submit' className="btn btn-block">
                        Add Post
                    </button>
                </div>
            </form>
        </div>
        </>
  )
}

export default NewPost;
