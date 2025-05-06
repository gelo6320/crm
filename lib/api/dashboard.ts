// lib/api/dashboard.js
import axios from 'axios';
import { API_BASE_URL } from './api-utils';

/**
 * Fetches dashboard statistics including total leads, conversion rates, and trending data
 * @returns {Promise<Object>} Dashboard statistics
 */
export async function fetchDashboardStats() {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/dashboard/stats`, {
      withCredentials: true
    });
    
    return response.data;
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    
    // Return default values on error
    return {
      forms: { 
        total: 0, 
        converted: 0, 
        conversionRate: 0,
        trend: 0 
      },
      bookings: { 
        total: 0, 
        converted: 0, 
        conversionRate: 0,
        trend: 0 
      },
      facebook: { 
        total: 0, 
        converted: 0, 
        conversionRate: 0,
        trend: 0 
      },
      events: { 
        total: 0, 
        success: 0, 
        successRate: 0,
        conversionRate: 0
      },
      totalConversionRate: 0
    };
  }
}

/**
 * Fetches recent CRM events
 * @returns {Promise<Array>} Recent events
 */
export async function fetchRecentEvents() {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/dashboard/recent-events`, {
      withCredentials: true
    });
    
    return response.data;
  } catch (error) {
    console.error('Error fetching recent events:', error);
    return [];
  }
}

/**
 * Fetches new unviewed contacts
 * @returns {Promise<Array>} Unviewed contacts
 */
export async function fetchNewContacts() {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/dashboard/new-contacts`, {
      withCredentials: true
    });
    
    return response.data;
  } catch (error) {
    console.error('Error fetching new contacts:', error);
    return [];
  }
}

/**
 * Marks a contact as viewed
 * @param {string} contactId - The ID of the contact to mark as viewed
 * @returns {Promise<Object>} Response data
 */
export async function markContactAsViewed(contactId: string) {
  try {
    const response = await axios.post(`${API_BASE_URL}/api/dashboard/mark-viewed/${contactId}`, {}, {
      withCredentials: true
    });
    
    return response.data;
  } catch (error) {
    console.error('Error marking contact as viewed:', error);
    throw error;
  }
}