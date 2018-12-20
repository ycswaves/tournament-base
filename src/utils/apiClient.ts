export class ServiceClient {
  public static async get(url: string): Promise<any> {
    const rawResp = await fetch(url);
    return await rawResp.json();
  }

  public static async post(url: string, payload?: string): Promise<any> {
    const rawResp = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded; charset=utf-8'
      },
      body: payload
    });

    return await rawResp.json();
  }
}
