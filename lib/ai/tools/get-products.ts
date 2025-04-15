import { tool } from 'ai';
import { z } from 'zod';

export const getProducts = tool({
  description: 'Fetch a list of products from the API',
  parameters: z.object({
    // latitude: z.number(),
    // longitude: z.number(),
  }),

  execute: async () => {
    const response = await fetch(
      `https://fakestoreapi.com/products?limit=2`,
    );

    const productsData = await response.json();
    return productsData;
  },
});

