export interface Type {
  _id: string;
  name: string;           // Tên loại
  slug: string;           // URL slug (unique)
  genders?: any[];        // Array of gender references
  tags?: any[];           // Array of tag references
  createdAt?: string;     // timestamps
  updatedAt?: string;     // timestamps
}
