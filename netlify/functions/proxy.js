// Netlify Serverless Function — sunsang24.com CORS 프록시
// 서버사이드에서 실행되므로 CORS 문제 없음

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Content-Type': 'application/json; charset=utf-8',
  };

  // OPTIONS preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' };
  }

  // GET ?url=https://xxx.sunsang24.com/...
  const targetUrl = event.queryStringParameters && event.queryStringParameters.url;

  if (!targetUrl) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: 'url 파라미터가 필요합니다. 예: ?url=https://myungjin.sunsang24.com/ship/schedule_fleet/202604' }),
    };
  }

  // 보안: sunsang24.com 도메인만 허용
  try {
    const parsed = new URL(targetUrl);
    if (!parsed.hostname.endsWith('sunsang24.com')) {
      return {
        statusCode: 403,
        headers,
        body: JSON.stringify({ error: 'sunsang24.com 도메인만 허용됩니다.' }),
      };
    }
  } catch (e) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: '유효하지 않은 URL입니다.' }),
    };
  }

  try {
    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
      },
      redirect: 'follow',
    });

    const html = await response.text();

    return {
      statusCode: response.status,
      headers: {
        ...headers,
        'Content-Type': 'application/json; charset=utf-8',
      },
      body: JSON.stringify({
        status: response.status,
        url: targetUrl,
        contents: html,
        length: html.length,
      }),
    };
  } catch (e) {
    return {
      statusCode: 502,
      headers,
      body: JSON.stringify({ error: `페치 실패: ${e.message}`, url: targetUrl }),
    };
  }
};
