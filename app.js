const express = require('express');
const request = require('request');
const parser = require('xml2json');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const templates = require('consolidate');
const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());
app.engine('hbs', templates.handlebars);
app.set('view engine', 'hbs');
app.set('views', `${__dirname}/layouts`);
app.use('/static', express.static(`${__dirname}/static`));

function renderNews(req, res, cat) {
    let category = {};
    switch (req.body.newsCategory || cat) {
        case 'politics':
            category.link = `politics`;
            category.title = `политики`;
            break;
        case 'economics':
            category.link = `economics`;
            category.title = `экономики`;
            break;
        case 'society':
            category.link = `society`;
            category.title = `общества`;
            break;
        case 'incident':
            category.link = `incident`;
            category.title = `событий`;
            break;
        case 'sport':
            category.link = 'sport';
            category.title = 'спорта';
            break;
        default:
            category.link = false;
            category.title = false;
    }

    if (category.link) {
        request(`https://news.mail.ru/rss/${category.link}/90/`, (error, response, body) => {
            if (!error && response.statusCode === 200) {
                const result = JSON.parse(parser.toJson(body)),
                    news = result.rss.channel.item;

                res.cookie('category', category.link, {maxAge: 120000});
                res.render('news', {
                    news: news,
                    title: category.title
                });
            }
        });
    } else {
        res.render('404', {
            title: 'Ошибка: Запрашиваемый новостной раздел не существует.'
        });
    }
}

app.get('/', (req, res) => {
    const category = req.query.category || req.cookies.category;
    if (category) {
        renderNews(req, res, category);
    } else {
        res.render('index', {});
    }
});

app.get('/css/*', (req, res) => {
    res.static();
});

app.post('/', (req, res) => {
        renderNews(req, res);
    }
);

app.get('/*', (req, res) => {
    res.render('404', {
        title: 'Ошибка: Запрашиваемая страница не найдена.'
    });
});

app.listen('3001');
console.log('Server started...');