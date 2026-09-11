/**
 * Robust HTTP client based on native fetch (similar to Axios).
 * Features:
 * - Request/Response interceptors
 * - Unified error handling (HttpError)
 * - Timeout control (AbortController)
 * - Automatic JSON parsing
 * - RESTful methods (get, post, put, delete)
 */

export type ApiType = "default" | "lottery" | string;

export interface RequestConfig extends Omit<RequestInit, 'body'> {
  url?: string;
  baseURL?: string;
  params?: Record<string, string | number | boolean | null | undefined>;
  data?: any; // Replaces native body, supports automatic JSON serialization
  timeoutMs?: number; // Timeout in ms, default 15000ms
  skipAuth?: boolean; // Skip Token injection
  skipErrorHandler?: boolean; // Disable global error interceptor for specific request
  apiType?: ApiType; // Define which API to route to. Default is "default" (WF).
}

export class HttpError extends Error {
  public status?: number;
  public code?: number | string;
  public data?: any; // Original error data returned by API

  constructor(message: string, status?: number, code?: number | string, data?: any) {
    super(message);
    this.name = "HttpError";
    this.status = status;
    this.code = code;
    this.data = data;
  }
}

type RequestInterceptor = (config: RequestConfig) => RequestConfig | Promise<RequestConfig>;
type ResponseInterceptor = (response: any, config: RequestConfig) => any | Promise<any>;
type ErrorInterceptor = (error: HttpError, config: RequestConfig) => Promise<any>;

export class HttpClient {
  private baseURL: string;
  private endpoints: Record<string, string>;
  private defaultTimeout: number;

  public interceptors = {
    request: [] as RequestInterceptor[],
    response: [] as ResponseInterceptor[],
    error: [] as ErrorInterceptor[],
  };

  constructor(config: { baseURL?: string; endpoints?: Record<string, string>; defaultTimeout?: number } = {}) {
    this.baseURL = config.baseURL || "";
    this.endpoints = {
      default: config.baseURL || "",
      ...config.endpoints,
    };
    this.defaultTimeout = config.defaultTimeout || 15000;
  }

  public setBaseURL(url: string) {
    this.baseURL = url;
    this.endpoints["default"] = url;
  }

  public setEndpoint(type: string, url: string) {
    this.endpoints[type] = url;
  }

  public setEndpoints(endpoints: Record<string, string>) {
    this.endpoints = { ...this.endpoints, ...endpoints };
    if (endpoints["default"]) {
      this.baseURL = endpoints["default"];
    }
  }

  public getEndpoint(type?: string): string {
    if (type && this.endpoints[type]) {
      return this.endpoints[type];
    }
    return this.baseURL || this.endpoints["default"] || "";
  }

  public async request<T = any>(config: RequestConfig): Promise<T> {
    // 1. Execute Request Interceptors
    let processedConfig = { ...config };
    for (const interceptor of this.interceptors.request) {
      processedConfig = await interceptor(processedConfig);
    }

    // 2. Determine base URL based on apiType
    const selectedBaseURL = processedConfig.baseURL || this.getEndpoint(processedConfig.apiType || "default");
    
    // Build full URL
    let fullUrl: string;
    const reqUrl = processedConfig.url || "";
    if (reqUrl.startsWith("http://") || reqUrl.startsWith("https://")) {
      fullUrl = reqUrl;
    } else if (selectedBaseURL) {
      const baseClean = selectedBaseURL.replace(/\/+$/, "");
      const pathClean = reqUrl.replace(/^\/+/, "");
      fullUrl = pathClean ? `${baseClean}/${pathClean}` : baseClean;
    } else {
      fullUrl = typeof window !== "undefined"
        ? `${window.location.origin}${reqUrl.startsWith("/") ? "" : "/"}${reqUrl}`
        : `http://localhost${reqUrl.startsWith("/") ? "" : "/"}${reqUrl}`;
    }

    const url = new URL(fullUrl);

    // Process Query Params
    if (processedConfig.params) {
      Object.entries(processedConfig.params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          url.searchParams.set(key, String(value));
        }
      });
    }

    // Process Body (Auto JSON serialization)
    let body: BodyInit | undefined = undefined;
    const headers = new Headers(processedConfig.headers || {});
    if (processedConfig.data) {
      if (processedConfig.data instanceof FormData) {
        body = processedConfig.data;
      } else {
        body = JSON.stringify(processedConfig.data);
        if (!headers.has("Content-Type")) {
          headers.set("Content-Type", "application/json");
        }
      }
    }

    // Timeout control
    const controller = new AbortController();
    const timeoutThreshold = processedConfig.timeoutMs ?? this.defaultTimeout;
    const timeoutId = setTimeout(() => controller.abort(), timeoutThreshold);

    if (processedConfig.signal) {
      processedConfig.signal.addEventListener("abort", () => {
        controller.abort();
      });
    }

    const fetchConfig: RequestInit = {
      ...processedConfig,
      headers,
      body,
      signal: controller.signal,
    };

    // 3. Send request
    try {
      const response = await fetch(url.toString(), fetchConfig);
      clearTimeout(timeoutId);

      // Handle 4xx, 5xx HTTP errors
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new HttpError(
          `Request failed with status ${response.status}`,
          response.status,
          errorData?.code || 'NETWORK_ERROR',
          errorData
        );
      }

      // De-serialize response
      const text = await response.text();
      let data: any = text;
      if (text) {
        try {
          data = JSON.parse(text);
        } catch {
          // Keep as string if not JSON
        }
      }

      // 4. Execute Response Interceptors
      let processedData = data;
      for (const interceptor of this.interceptors.response) {
        processedData = await interceptor(processedData, processedConfig);
      }

      return processedData as T;

    } catch (err: any) {
      clearTimeout(timeoutId);

      let httpError: HttpError;
      if (err.name === "AbortError") {
        httpError = new HttpError("Request timeout or cancelled", 408, "TIMEOUT");
      } else if (err instanceof HttpError) {
        httpError = err;
      } else {
        httpError = new HttpError(err.message || "Unknown network error", 0, "UNKNOWN", err);
      }

      // Trigger global Error Interceptors
      if (!processedConfig.skipErrorHandler) {
        for (const errorInterceptor of this.interceptors.error) {
          await errorInterceptor(httpError, processedConfig);
        }
      }

      throw httpError;
    }
  }

  public get<T = any>(url: string, config?: Omit<RequestConfig, "url" | "method">) {
    return this.request<T>({ ...config, url, method: "GET" });
  }

  public post<T = any>(url: string, data?: any, config?: Omit<RequestConfig, "url" | "method" | "data">) {
    return this.request<T>({ ...config, url, method: "POST", data });
  }

  public put<T = any>(url: string, data?: any, config?: Omit<RequestConfig, "url" | "method" | "data">) {
    return this.request<T>({ ...config, url, method: "PUT", data });
  }

  public delete<T = any>(url: string, config?: Omit<RequestConfig, "url" | "method">) {
    return this.request<T>({ ...config, url, method: "DELETE" });
  }
}

// ----------------------------------------------------------------------
// Export Default Instance
// ----------------------------------------------------------------------
export const apiClient = new HttpClient({
  baseURL: "",
  endpoints: {
    default: "",
    lottery: "https://wf.vip/backend/api/v1",
  },
});

// [Interceptor] Response: Unpacks data based on backend 'code' convention
apiClient.interceptors.response.push(async (data, _config) => {
  // Backend standard: { code: 0, msg: "success", data: {} }
  if (data && typeof data === "object" && "code" in data) {
    if (data.code !== 0 && data.code !== 200) {
      throw new HttpError(data.msg || "Server Error", 200, data.code, data);
    }
    return data.data; // Unpack data
  }
  return data;
});

// [Interceptor] Error: Global error reporting (Event Dispatch)
apiClient.interceptors.error.push(async (error, config) => {
  if (typeof window !== "undefined") {
    // 处理核心的 401 熔断！(HTTP 401 或者是业务 code 401)
    if (error.status === 401 || error.code === 401 || error.code === '401') {
      window.dispatchEvent(new CustomEvent("api:auth_expired", { detail: error }));
    }

    if (!config.skipErrorHandler) {
      window.dispatchEvent(new CustomEvent("api:error", { detail: error }));
    }
  }
});

/**
 * 注入业务层获取 token 的方法
 * (我们将在应用初始化处，传入 useAuthStore.getState().token)
 */
export function setupHttpAuth(getToken: () => Promise<string | null> | string | null) {
  // Ensure we don't add duplicate interceptors if called multiple times
  if (apiClient.interceptors.request.length > 0) return;
  
  apiClient.interceptors.request.push(async (config) => {
    if (config.skipAuth) return config;
    try {
      const token = await getToken();
      if (token) {
        config.headers = {
          ...config.headers,
          Authorization: `Bearer ${token}`, // 这里可根据后端要求调整前缀，如果是原始字符串就不带 Bearer
        };
      }
    } catch (e) {
      console.warn("Failed to get auth token for request", e);
    }
    return config;
  });
}
