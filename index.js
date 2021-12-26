const cors_headers = { 
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
  "Access-Control-Max-Age": "86400",
  "Access-Control-Allow-Headers" : "*"
};

const response_400 = message => {
  return new Response(message, {
    status: 400,
    headers: cors_headers
  });
};

const response_405 = message => {
  return new Response(message, {
    status: 405,
    headers: cors_headers
  });
};

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})
/**
 * @param {Request} request
 */
async function handleRequest(request) {

  const pathname = new URL(request.url).pathname;

  if (pathname !== "/posts") return response_400("Invalid path");

  switch(request.method) {
    case "GET":
      return getPosts();
    case "POST":
      try {
        return post(await request.json());
      } catch (error) {
        return post({});
      }
    case "OPTIONS":
      return new Response(null, {
        headers: cors_headers
      })
    default:
      return response_405("Expected GET or POST");
  }
}

/**
 * Retrieves a list of posts in JSON form.
 */
async function getPosts() {

  const keys = (await POSTS.list()).keys;

  const promises = keys.map(key => POSTS.get(key.name));

  const posts_json = await Promise.all(promises);

  const posts = posts_json.map(json => JSON.parse(json));

  // order by newest to oldest
  posts.sort((first, second) => {
    let first_date = new Date(first.createdTime);
    let second_date = new Date(second.createdTime);
    if (first_date < second_date) return 1;
    if (first_date > second_date) return -1;
    return 0;
  });

  const response_json = JSON.stringify(posts, null, 2);

  return new Response(response_json, {
    status: 200,
    statusText: "OK",
    headers: { 
      ...cors_headers,
      "content-type": "application/json;charset=UTF-8" 
    },
  });
}

/**
 * Checks the validity of the submitted post data. If valid, adds the post to the database.
 * @param post The post data
 */
async function post(post) {
  if (!isValid(post)) return response_400("Invalid post data");

  post.id = generateRandomId();
  post.createdTime = new Date();

  await POSTS.put(post.id, JSON.stringify(post));
  return new Response("Success", {
    status: 200,
    statusText: "OK",
    headers: { 
      ...cors_headers,
      "content-type": "text/plain" 
    },
  });
}

/**
 * Returns whether or not the post data has all the desired properties with specific types.
 * @param post The post data.
 */
function isValid(post) {
  return typeof(post.title) === "string" 
  && typeof(post.username) === "string" 
  && typeof(post.content) === "string";
}

/**
 * Returns a random id string generated from the given character set of given length.
 * @param length The desired length of the id.
 * @param characters A string of unique characters of which can be chosen to build the id.
 */
function generateRandomId(length = 10, characters = "abcdefghijklmnopqrstuvwxzyABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789") {
  let id = "";
  for (let i = 0; i < length; i++) {
    id += characters[Math.floor(Math.random() * characters.length)];
  }
  return id;
}