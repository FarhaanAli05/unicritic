import axios from "axios";

export default async function fetcher<T>(url: string): Promise<T> {
  try {
    const { data } = await axios.get(url);
    return data;
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.message || error.message);
    }
    throw error;
  }
}
