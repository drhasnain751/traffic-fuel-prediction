const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api';

export interface User {
  id: number;
  name: string;
  email: string;
  role: 'USER' | 'ANALYST';
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface CongestionResponse {
  segment_id: string;
  target_time: string;
  predicted_speed: number;
  congestion_level: 'LOW' | 'MEDIUM' | 'HIGH';
  model_version: string;
  freshness: string;
}

export interface FuelEstimateResponse {
  route_segments: string[];
  total_distance_km: number;
  predicted_fuel_l: number;
  estimated_cost: number;
  segment_breakdown: Array<{
    segment_id: string;
    congestion_level: string;
    predicted_speed: number;
    fuel_l: number;
  }>;
  congestion_model_version: string;
  fuel_model_version: string;
  freshness: string;
}

export interface RouteComparisonResponse {
  route_a: FuelEstimateResponse;
  route_b: FuelEstimateResponse;
  recommendation: string;
  difference_fuel_l: number;
  difference_cost: number;
}

class ApiService {
  private getToken(): string | null {
    const token = localStorage.getItem('access_token');
    console.log('[API] getToken called, found:', token ? `${token.substring(0, 30)}...` : 'NO TOKEN');
    return token;
  }

  public setAuth(data: AuthResponse) {
    console.log('[API] setAuth called with:', data);
    localStorage.setItem('access_token', data.access_token);
    localStorage.setItem('user', JSON.stringify(data.user));
    console.log('[API] Token stored:', localStorage.getItem('access_token')?.substring(0, 50));
  }

  public clearAuth() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
  }

  public getSavedUser(): User | null {
    const userStr = localStorage.getItem('user');
    if (!userStr) return null;
    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = this.getToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {}),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
      console.log(`[API] Sending request to ${endpoint} with token: ${token.substring(0, 20)}...`);
    } else {
      console.log(`[API] Sending request to ${endpoint} WITHOUT token`);
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({ detail: 'An unexpected error occurred' }));
      throw new Error(errData.detail || `HTTP Error ${response.status}`);
    }

    return response.json();
  }

  // Auth APIs
  async signup(name: string, email: string, password: string, role: string = 'USER'): Promise<AuthResponse> {
    const res = await this.request<AuthResponse>('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ name, email, password, role }),
    });
    this.setAuth(res);
    return res;
  }

  async login(email: string, password: string): Promise<AuthResponse> {
    const res = await this.request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    this.setAuth(res);
    return res;
  }

  async getMe(): Promise<User> {
    return this.request<User>('/auth/me');
  }

  // Prediction APIs
  async predictCongestion(segmentId: string, targetTime: string = 'Now'): Promise<CongestionResponse> {
    return this.request<CongestionResponse>(`/predict-congestion?segment_id=${encodeURIComponent(segmentId)}&target_time=${encodeURIComponent(targetTime)}`);
  }

  async predictFuel(route: string[], vehicleType: string = 'medium sedan', baseEfficiency: number = 8.5): Promise<FuelEstimateResponse> {
    return this.request<FuelEstimateResponse>('/predict-fuel', {
      method: 'POST',
      body: JSON.stringify({
        route,
        vehicle: { vehicle_type: vehicleType, base_efficiency: baseEfficiency }
      }),
    });
  }

  async compareRoutes(routeA: string[], routeB: string[], vehicleType: string = 'medium sedan', baseEfficiency: number = 8.5): Promise<RouteComparisonResponse> {
    return this.request<RouteComparisonResponse>('/compare-routes', {
      method: 'POST',
      body: JSON.stringify({
        route_a: routeA,
        route_b: routeB,
        vehicle: { vehicle_type: vehicleType, base_efficiency: baseEfficiency }
      }),
    });
  }

  // Analytics & Sources
  async getHistoricalTrends(segmentId: string = 'SEG-101'): Promise<{ segment_id: string; data: any[] }> {
    return this.request(`/analytics/history?segment_id=${encodeURIComponent(segmentId)}`);
  }

  async getDataSourcesStatus(): Promise<{ sources: any[] }> {
    return this.request('/sources/status');
  }

  async getModelMetrics(modelType: string): Promise<Record<string, number>> {
    return this.request(`/models/metrics?model_type=${encodeURIComponent(modelType)}`);
  }

  async retrainModel(modelType: string = 'both', trainingWindow: string = '2023-01-01 to 2026-08-01'): Promise<any> {
    return this.request('/models/retrain', {
      method: 'POST',
      body: JSON.stringify({ model_type: modelType, training_window: trainingWindow }),
    });
  }
}

export const api = new ApiService();
