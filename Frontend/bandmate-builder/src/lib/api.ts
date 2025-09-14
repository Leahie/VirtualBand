import axios from "axios";

// Define types for better type safety
interface BandData {
  name: string;
  date_created: any;
  date_modified: any; 
  original_song: string; 
  modified_song: string;
}

interface UploadResponse {
  s3_url: string;
  filename: string;
  size: number;
  message: string;
}



const api = axios.create({
  baseURL: "http://127.0.0.1:5000/api/v1/bands",
  timeout: 5000,
});

export const getBands = () => api.get("/");
export const getBandById = (id: string) => api.get(`/id/${id}`);
export const createBand = (bandData: BandData) => api.post("/add", bandData);
export const editBand = (bandData: BandData) => api.put("/edit", bandData); 
export const deleteBand = (id: string) => api.delete(`/delete/${id}`);

export const uploadFileToS3 = async (formData: FormData): Promise<UploadResponse> => {
  try {
    const response = await api.post<UploadResponse>("/upload", formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 30000, // 30 seconds for file upload
    });
    return response.data;
  } catch (error) {
    console.error('Upload error:', error);
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.error || 'Upload failed');
    }
    throw error;
  }
};

export const uploadFileAndCreateBand = async (s3_url: string, bandName: string): Promise<void> => {
  try {
    if (!s3_url || !bandName.trim()) {
      throw new Error('S3 URL and band name are required');
    }

    const bandData: BandData = {
      name: bandName.trim(),
      date_created: new Date().toISOString(), // Fixed: use ISO string instead of timestamp
      date_modified: new Date().toISOString(), // Fixed: use ISO string instead of timestamp
      original_song: s3_url,
      modified_song: s3_url
    };
    
    console.log('Creating band with data:', bandData);
    await createBand(bandData);
    console.log('Band created successfully');
  } catch (error) {
    console.error('Error creating band:', error);
    throw error;
  }
};