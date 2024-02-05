import {
    findLLMById,
    allLLMsForUser,
    getUsersForLLM, 
    getCreatedAt,
    getSampleQuestions
  } from "../models/llm";
  
  export default {
    Query: {
        llm: async (root, { id }, context, info) => {
        return await findLLMById(id, context);
      },
      allLLMsForUser: async (root, { id }, context) => {
        return await allLLMsForUser(context);
      }
    },
    LLM: {
      users: async (LLM) => {
        return await getUsersForLLM(LLM.id);
      },
      sampleQuestions: async (LLM) => {
        return await getSampleQuestions(LLM.id);
      },
      createdAt: async (LLM) => {
        return await getCreatedAt(LLM.id);
      }
    },
  };
  