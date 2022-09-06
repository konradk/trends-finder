const LIMIT = 100;

const getApiUrl = (env) => {
  if (env === "labs") {
    return "https://api.labs.livechatinc.com";
  }
  return "https://api.livechatinc.com";
};

const createApi = (token, env) => {
  const fetchData = (_token, query, page) => {
    let body = {
      filters: {
        query,
      },
      limit: LIMIT,
      pagination: {
        page,
      },
    };
    if (page) {
      body = {
        page_id: page,
      };
    }
    return fetch(`${getApiUrl(env)}/v3.3/agent/action/list_archives`, {
      headers: {
        Authorization: `Bearer ${_token}`,
        "Content-Type": "application/json",
      },
      method: "POST",
      body: JSON.stringify(body),
    }).then((res) => res.json());
  };

  const run = (query, exactPhrase, callback) => {
    let res = [];
    const parsedQuery = exactPhrase ? `"${query}"` : query;
    return fetchData(token, parsedQuery, null)
      .then((data) => {
        res = data.chats;
        const allChats = data.found_chats;
        let overLimit = allChats / LIMIT > 10;
        let nextPageId = data.next_page_id;
        let pages = Math.min(Math.ceil(allChats / LIMIT), 10);
        callback({
          done: 1,
          pages,
          overLimit,
          totalResults: allChats,
        });
        if (pages > 1) {
          return [...Array(pages - 1).keys()].reduce((acc, current) => {
            return acc.then(() => {
              callback({
                done: current + 1,
                pages,
                overLimit,
                totalResults: allChats,
              });
              return fetchData(token, query, nextPageId).then((data) => {
                res = [...res, ...data.chats];
                nextPageId = data.next_page_id;
              });
            });
          }, Promise.resolve({}));
        }
      })
      .then(() => {
        return res;
      });
  };

  return {
    run,
  };
};

export default createApi;
