const LIMIT = 100

function get(propPath, obj) {
	const arrPath = typeof propPath === 'string' ? propPath.split('.') : propPath
	let pathPartIndex = 0
	let result = obj
	while (result && pathPartIndex < arrPath.length) {
		result = result[arrPath[pathPartIndex++]]
	}
	return result
}

const getApiUrl = env => {
    if (env === 'labs') {
        return 'https://api.labs.livechatinc.com'
    }
    return 'https://api.livechatinc.com'
}

const createApi = (token, env) => {
    const fetchData = (_token, query, page) => {
        return fetch(`${getApiUrl(env)}/v3.1/agent/action/get_archives`, {
           "headers": {
               "Authorization": `Bearer ${_token}`,
               "Content-Type": "application/json",
           },
           "method": "POST",
           body: JSON.stringify({
               filters: {
                   query,
               },
               pagination: {
                   limit: LIMIT,
                   page
               }
           })
       }).then(res => res.json())
       }
          
       
       const run = (query, callback) => {
           let res = []
           return fetchData(token, query, 1).then(data => {
               let pages = Math.ceil(data.pagination.total / LIMIT)
               res = data.chats
               callback({
                   done: 1,
                   pages,
               })
               if (pages > 1) {
                   return [...Array(pages - 1 ).keys()].reduce((acc, current) => {
                       return acc.then(() => {
                           callback({
                   done: current + 1,
                   pages,
               })
                          return fetchData(token, query, current + 2).then(data => {
                               res = [...res, ...data.chats]
                           })
                       })
                   }, Promise.resolve({}))
               }
           }).then(() => {
               return res
            //    const monts = res.map(chat => {  
            //        const dateObject = new Date(chat.thread.timestamp * 1000)
            //        const year = new Intl.DateTimeFormat('en', { year: 'numeric' }).format(dateObject)
            //        const month = new Intl.DateTimeFormat('en', { month: 'short' }).format(dateObject)
            //        const day = new Intl.DateTimeFormat('en', { day: '2-digit' }).format(dateObject)
            //        return {
            //            day,
            //            month,
            //            year
            //        }
            //    })
            //    const parsed = monts.reduce((acc, current) => {
            //        return {
            //            ...acc,
            //            [current.year]: {
            //                ...acc[current.year],
            //                [current.month]: {
            //                     ...get(`${current.year}.${current.month}`, acc),
            //                     [current.day]: get(`${current.year}.${current.month}.${current.day}`, acc) ? get(`${current.year}.${current.month}.${current.day}`, acc) + 1 : 1,
            //                }
            //            }
            //        }
            //    }, {})
            //    console.log('>> parsed', parsed)
            //    return parsed
           })
       }
       
    return {
        run
    }       
}

export default createApi
