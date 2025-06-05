// lib/api/dashboard.ts - Versione semplificata
import axios from 'axios';
import { API_BASE_URL } from './api-utils';

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

/**
 * Marks all contacts as viewed
 * @returns {Promise<Object>} Response data
 */
export async function markAllContactsAsViewed() {
  try {
    const response = await axios.post(`${API_BASE_URL}/api/dashboard/mark-all-viewed`, {}, {
      withCredentials: true
    });
    
    return response.data;
  } catch (error) {
    console.error('Error marking all contacts as viewed:', error);
    throw error;
  }
}

/**
 * Fetches user configuration including name and company logo
 * @returns {Promise<Object>} User configuration
 */
export async function fetchUserConfig() {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/user/config`, {
      withCredentials: true
    });
    
    return response.data?.config || {};
  } catch (error) {
    console.error('Error fetching user config:', error);
    return {};
  }
}