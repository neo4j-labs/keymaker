import axios from "axios";

// Updates the engine cache in the Engine API
export const updateEngineCache = async ({
  id,
  operation,
  updateByDependency,
}) => {
  const response = await axios
    .post(
      process.env.ENGINE_API_URI,
      {
        query: `
            query {
              updateEngineCache(
                id: "${id}"
                operation: "${operation}"
                updateByDependency: ${updateByDependency}
              )
            }
          `,
      },
      { headers: { "api-key": process.env.ENGINE_API_APIKEY } }
    )
    .catch((err) => {
      console.log(err);
      return err;
    });
  return true;
};
