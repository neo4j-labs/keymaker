import {
    findPromptTemplateById,
    allPromptTemplatesForUser,
    getUsersForPromptTemplate,
    getCreatedAt
  } from "../models/promptTemplate";
  
  export default {
    Query: {
        promptTemplate: async (root, { id }, context, info) => {
        return await findPromptTemplateById(id, context);
      },
      allPromptTemplatesForUser: async (root, { id }, context) => {
        return await allPromptTemplatesForUser(context);
      }
    },
    PromptTemplate: {
      users: async (PromptTemplate) => {
        return await getUsersForPromptTemplate(PromptTemplate.id);
      },
      createdAt: async (PromptTemplate) => {
        return await getCreatedAt(PromptTemplate.id);
      }
    },
  };
  