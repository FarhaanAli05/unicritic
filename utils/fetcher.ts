import axios from "axios";

export default async function fetcher<T = any>(url: string): Promise<T> {
  try {
  const { data } = await axios.get(url);
  return data;
  } catch (error: any) {
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.message || error.message);
    }
    throw error;
  }
}