import { Route } from '@/types';
import cache from '@/utils/cache';
import got from '@/utils/got';
import { parseDate } from '@/utils/parse-date';

export const route: Route = {
    path: '/news/:category?',
    categories: ['blog'],
    example: '/xsky/news',
    parameters: { category: '新闻分类, 见下表,默认为全部' },
    features: {
        requireConfig: false,
        requirePuppeteer: false,
        antiCrawler: false,
        supportBT: false,
        supportPodcast: false,
        supportScihub: false,
    },
    radar: [
        {
            source: ['xsky.com/about/news', 'xsky.com/'],
        },
    ],
    name: 'XSKY 新闻',
    maintainers: ['sean10'],
    handler,
};

async function handler(ctx) {
    const category = ctx.req.param('category') ?? '';
    const rootUrl = 'https://www.xsky.com';
    const currentUrl = `${rootUrl}/about/news/index/id/136,137,138,139`;

    const response = await got({
        method: 'post',
        url: `${rootUrl}/about/news/list`,
        headers: {
            Referer: currentUrl,
            pragma: 'no-cache',
            'sec-ch-ua': '"Chromium";v="123", "Not:A-Brand";v="8"',
            'sec-ch-ua-mobile': '?0',
            'sec-ch-ua-platform': '"macOS"',
            'sec-fetch-dest': 'empty',
            'sec-fetch-mode': 'cors',
            'sec-fetch-site': 'same-origin',
            accept: '*/*',
            'accept-language': 'zh-CN,zh-TW;q=0.9,zh;q=0.8,en-US;q=0.7,en;q=0.6',
            'cache-control': 'no-cache',
            'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
            'x-requested-with': 'XMLHttpRequest',
            'Referrer-Policy': 'strict-origin-when-cross-origin',
        },
        form: {
            limit: 20,
            category_id: category,
        },
    });

    const items = await Promise.all(
        response.data.data.data.map((item) =>
            cache.tryGet(item.url, () => {
                const new_url = new URL(item.url, rootUrl).href;

                return Promise.resolve({
                    title: item.title,
                    link: new_url,
                    description: item.description,
                    pubDate: parseDate(item.pub_date),
                    category: [item.category_id_text, ...item.product_tags.split(','), ...item.common_solution_tags.split(',')].filter(Boolean),
                    author: 'XSKY',
                });
            })
        )
    );

    return {
        title: 'XSKY 新闻',
        link: `${rootUrl}/about/news`,
        item: items,
    };
}
