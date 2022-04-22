
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

module.exports = (app) => {

    app.get('/posts/index', async (req, res) => {
        
        const posts = await prisma.post.findMany({
            include: {
                subreddit: true
            }
        });
        res.render('posts-index', { posts })
    });

    app.get('/posts/new', (req, res) => {
        if (!res.locals.currentUser) {
            res.redirect('/login')
        }
        res.render('posts-new');
    })

    app.post('/posts/new', async (req, res) => {
        if (!res.locals.currentUser) {
            res.redirect('/login')
        }     
        
        try {

            let subreddit = await prisma.subreddit.findFirst({
                where: {
                    name: req.body.subreddit
                }
            });
            if (!subreddit) {
                console.log('subreddit not found');
                subreddit = await prisma.subreddit.create({
                    data: {
                        name: req.body.subreddit
                    }
                });
                console.log('subreddit created');
            }


            await prisma.post.create({
                data: {
                    title: req.body.title,
                    url: req.body.url,
                    summary: req.body.summary,
                    subredditId: subreddit.id,
                    userId: res.locals.currentUser.id
                }
            })
            .then((post) => {
                console.log('Post created: ', post);
            })
        } catch (error) {
            console.log(error);
        }

        res.redirect('/');
    });

    app.get('/posts/:id', async (req, res) => {
        const post = await prisma.post.findFirst({
            where: {
                id: parseInt(req.params.id)
            },
            include: {
                subreddit: true,
                comments: true
            }
        });
        // console.log(post);
        res.render('posts-show', {post});
    });

    app.get('/posts/:id/delete', async (req, res) => {
        if (!res.locals.currentUser) {
            res.redirect('/login')
        }

        const postId = parseInt(req.params.id);

        const post = await prisma.post.findFirst({
            where: {
                id: postId
            }
        });

        if (!post) {
            console.log('post does not exist');
            res.redirect('/');
        }

        if (post.userId != res.locals.currentUser.id) {
            console.log('user does not own post');
            res.redirect('/posts/' + postId);
        }

        await prisma.post.delete({
            where: {
                id: postId
            }
        });
        await prisma.comment.deleteMany({
            where: {
                postId: postId
            }
        });
        res.redirect('/')
    });

    app.get('/n/:subreddit', async (req, res) => {
        const posts = await prisma.post.findMany({
            where: {
                subreddit: {
                    name: req.params.subreddit
                }
            },
            include: {
                subreddit: true
            }
        });
        res.render('posts-index', { posts, subreddit: req.params.subreddit });
    });

};