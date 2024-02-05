export const fetchGraphQL = ({ query, variables, uri, token, headers = {} }) => {
  return fetch(uri, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      // 'api-key': process.env.REACT_APP_RECOMMENDATION_API_KEY,
      'authorization': token ? `Bearer ${token}` : "",
      ...headers
    },
    body: JSON.stringify({
      query,
      variables
    }),
  })
  .then((res) => res.json());
};
