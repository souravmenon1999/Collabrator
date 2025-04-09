import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api'; // Adjust if your backend runs on a different port or URL

export const signup = async (userData: any) => {
    try {
        const response = await axios.post(`${API_BASE_URL}/signup`, userData);
        return { status: response.status, data: response.data };
    } catch (error: any) {
        return { status: error.response?.status || 500, data: error.response?.data || { message: 'Request failed' } };
    }
};

export const login = async (credentials: any) => {
    try {
        const response = await axios.post(`${API_BASE_URL}/login`, credentials);
        return { status: response.status, data: response.data };
    } catch (error: any) {
        return { status: error.response?.status || 500, data: error.response?.data || { message: 'Request failed' } };
    }
};