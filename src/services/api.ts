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
  ReportPayload
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

  // PDF Generation via Lovable Cloud
  generatePDF: async (companyName: string): Promise<{ html: string }> => {
    try {
      // Fetch all required data
      const [bidsData, departmentData, statesData, priceBandData, missedOpportunities, categories] = await Promise.all([
        apiService.getBids(companyName),
        apiService.getDepartments(),
        apiService.getTopStates(),
        apiService.getPriceBandAnalysis(companyName),
        apiService.getMissedButWinnable(companyName, 5, 10),
        apiService.getCategoryListing()
      ]);

      // Call edge function to generate HTML
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const response = await fetch(`${supabaseUrl}/functions/v1/generate-pdf`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          companyName,
          bidsData,
          departmentData,
          statesData,
          priceBandData,
          missedOpportunities,
          categories
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to generate report');
      }

      return await response.json();
    } catch (error: any) {
      console.error('Error generating report:', error);
      throw error;
    }
  }
};
