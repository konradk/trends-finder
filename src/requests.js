const LIMIT = 100;

const getApiUrl = (env) => {
  if (env === "labs") {
    return "https://api.labs.livechatinc.com";
  }
  return "https://api.livechatinc.com";
};

const createApi = (token, env) => {
  const fetchData = (_token, query, page) => {
    return fetch(`${getApiUrl(env)}/v3.2/agent/action/list_archives`, {
      headers: {
        Authorization: `Bearer ${_token}`,
        "Content-Type": "application/json",
      },
      method: "POST",
      body: JSON.stringify({
        filters: {
          query,
        },
        pagination: {
          limit: LIMIT,
          page,
        },
      }),
    }).then((res) => res.json());
  };

  const run = (query, callback) => {
    let res = [];
    return fetchData(token, query, 1)
      .then((data) => {
        let pages = Math.ceil(data.pagination.total / LIMIT);
        res = data.chats;
        callback({
          done: 1,
          pages,
        });
        if (pages > 1) {
          return [...Array(pages - 1).keys()].reduce((acc, current) => {
            return acc.then(() => {
              callback({
                done: current + 1,
                pages,
              });
              return fetchData(token, query, current + 2).then((data) => {
                res = [...res, ...data.chats];
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
