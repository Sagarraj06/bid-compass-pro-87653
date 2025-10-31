import axios, { AxiosError } from 'axios';
import { API_BASE_URL } from '@/utils/constants';
import type {
  BidsResponse,
  DepartmentResponse,
  Department,
  StatesResponse,
  PriceBandResponse,
  CategoryItem,
  MissedWinnableResponse,
  ReportPayload,
  ReportResponse
} from '@/types/api.types';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  },
  paramsSerializer: {
    encode: (param) => encodeURIComponent(param).replace(/%20/g, '%20')
  }
});

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    const token = sessionStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor with comprehensive error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    console.error('API Error Details:', {
      code: error.code,
      message: error.message,
      config: {
        url: error.config?.url,
        baseURL: error.config?.baseURL,
        method: error.config?.method
      },
      response: error.response ? {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data
      } : 'No response'
    });
    
    if (error.code === 'ECONNABORTED' || error.code === 'ERR_NETWORK') {
      return Promise.reject({
        message: `Backend connection failed. Using HTTP API (${API_BASE_URL}) from HTTPS site causes mixed content block. Server must use HTTPS.`,
        offline: true,
        details: error.message
      });
    }
    
    if (error.response?.status === 401) {
      sessionStorage.removeItem('token');
      window.location.href = '/login';
    }
    
    return Promise.reject(error);
  }
);

export const apiService = {
  // Company/Seller bids
  getBids: async (companyName: string): Promise<BidsResponse | null> => {
    try {
      const response = await apiClient.get('/bids', {
        params: { q: companyName }
      });
      return response.data;
    } catch (error: any) {
      console.error('Error fetching bids:', error);
      if (error.offline) throw error;
      return null;
    }
  },

  // Department analysis
  getTopSellersByDept: async (
    department: string,
    limit: number = 10
  ): Promise<DepartmentResponse | null> => {
    try {
      const response = await apiClient.get('/top-sellers-by-dept', {
        params: { department, limit }
      });
      return response.data;
    } catch (error: any) {
      console.error('Error fetching department sellers:', error);
      if (error.offline) throw error;
      return null;
    }
  },

  // All departments
  getDepartments: async (): Promise<Department[]> => {
    try {
      const response = await apiClient.get('/dept');
      return response.data;
    } catch (error: any) {
      console.error('Error fetching departments:', error);
      if (error.offline) throw error;
      return [];
    }
  },

  // State performance
  getTopStates: async (): Promise<StatesResponse | null> => {
    try {
      const response = await apiClient.get('/top-performing-states');
      return response.data;
    } catch (error: any) {
      console.error('Error fetching states:', error);
      if (error.offline) throw error;
      return null;
    }
  },

  // Price band
  getPriceBandAnalysis: async (
    companyName: string
  ): Promise<PriceBandResponse | null> => {
    try {
      const response = await apiClient.get('/price-band-analysis', {
        params: { q: companyName }
      });
      return response.data;
    } catch (error: any) {
      console.error('Error fetching price band:', error);
      if (error.offline) throw error;
      return null;
    }
  },

  // Missed opportunities
  getMissedButWinnable: async (
    sellerName: string,
    limit: number = 5,
    perItem: number = 10
  ): Promise<MissedWinnableResponse | null> => {
    try {
      const response = await apiClient.get('/missed-but-winnable', {
        params: { seller_name: sellerName, limit, perItem }
      });
      return response.data;
    } catch (error: any) {
      console.error('Error fetching missed opportunities:', error);
      if (error.offline) throw error;
      return null;
    }
  },

  // Category listing
  getCategoryListing: async (): Promise<CategoryItem[]> => {
    try {
      const response = await apiClient.get('/category-listing');
      return response.data;
    } catch (error: any) {
      console.error('Error fetching categories:', error);
      if (error.offline) throw error;
      return [];
    }
  },

  // PDF Generation
  generatePDF: async (payload: ReportPayload): Promise<ReportResponse> => {
    try {
      console.log('Generating PDF with payload:', payload);
      
      const response = await apiClient.post<ReportResponse>('/pdf', payload);
      return response.data;
    } catch (error) {
      console.error('Error generating PDF:', error);
      throw error;
    }
  }
};
