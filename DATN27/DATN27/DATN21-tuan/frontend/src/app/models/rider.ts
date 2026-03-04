export interface Rider {
  _id: string;
  name: string;           // Tên tay đua
  image: string;          // URL ảnh tay đua
  team?: string;          // Đội (optional)
  createdAt?: string;     // timestamps
  updatedAt?: string;     // timestamps
}
