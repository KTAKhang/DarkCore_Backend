# Hướng dẫn xử lý Error Response từ Product Service

## Format Response khi có lỗi trùng tên

Khi tạo hoặc cập nhật sản phẩm với tên đã tồn tại, API sẽ trả về:

```json
{
  "status": "ERR",
  "code": 409,
  "message": "Tên sản phẩm đã tồn tại. Vui lòng chọn tên khác",
  "field": "name",
  "errorType": "DUPLICATE_NAME"
}
```

## Ví dụ xử lý trong Frontend

### React với Axios

```javascript
import axios from 'axios';

const createProduct = async (productData) => {
  try {
    const formData = new FormData();
    formData.append('name', productData.name);
    formData.append('price', productData.price);
    // ... các field khác

    const response = await axios.post('/api/product-staff/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        'Authorization': `Bearer ${token}`
      }
    });

    if (response.data.status === 'OK') {
      // Thành công
      alert('Tạo sản phẩm thành công!');
      return response.data;
    }
  } catch (error) {
    // Xử lý lỗi
    const errorData = error.response?.data;
    
    if (errorData?.status === 'ERR') {
      // Hiển thị thông báo lỗi
      alert(errorData.message);
      
      // Highlight field bị lỗi (nếu có)
      if (errorData.field) {
        const fieldElement = document.querySelector(`[name="${errorData.field}"]`);
        if (fieldElement) {
          fieldElement.classList.add('error');
          fieldElement.focus();
        }
      }
      
      // Xử lý logic đặc biệt dựa vào errorType
      if (errorData.errorType === 'DUPLICATE_NAME') {
        // Có thể focus vào field name hoặc hiển thị gợi ý
        console.log('Tên sản phẩm đã tồn tại, vui lòng chọn tên khác');
      }
    } else {
      alert('Có lỗi xảy ra. Vui lòng thử lại!');
    }
    
    throw error;
  }
};

const updateProduct = async (productId, productData) => {
  try {
    const formData = new FormData();
    formData.append('name', productData.name);
    // ... các field khác

    const response = await axios.put(`/api/product-staff/${productId}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        'Authorization': `Bearer ${token}`
      }
    });

    if (response.data.status === 'OK') {
      alert('Cập nhật sản phẩm thành công!');
      return response.data;
    }
  } catch (error) {
    const errorData = error.response?.data;
    
    if (errorData?.status === 'ERR') {
      // Hiển thị thông báo lỗi
      alert(errorData.message);
      
      // Highlight field bị lỗi
      if (errorData.field) {
        const fieldElement = document.querySelector(`[name="${errorData.field}"]`);
        if (fieldElement) {
          fieldElement.classList.add('error');
          fieldElement.focus();
        }
      }
    } else {
      alert('Có lỗi xảy ra. Vui lòng thử lại!');
    }
    
    throw error;
  }
};
```

### React với useState và toast notification

```javascript
import { useState } from 'react';
import { toast } from 'react-toastify'; // hoặc thư viện toast khác

const ProductForm = () => {
  const [errors, setErrors] = useState({});
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    // ... các field khác
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});

    try {
      const formDataToSend = new FormData();
      Object.keys(formData).forEach(key => {
        formDataToSend.append(key, formData[key]);
      });

      const response = await fetch('/api/product-staff/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formDataToSend
      });

      const data = await response.json();

      if (data.status === 'OK') {
        toast.success(data.message || 'Tạo sản phẩm thành công!');
        // Reset form hoặc redirect
      } else if (data.status === 'ERR') {
        // Hiển thị thông báo lỗi
        toast.error(data.message);
        
        // Set error cho field cụ thể
        if (data.field) {
          setErrors(prev => ({
            ...prev,
            [data.field]: data.message
          }));
        }
      }
    } catch (error) {
      toast.error('Có lỗi xảy ra. Vui lòng thử lại!');
      console.error('Error:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label>Tên sản phẩm</label>
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={(e) => setFormData({...formData, name: e.target.value})}
          className={errors.name ? 'error' : ''}
        />
        {errors.name && <span className="error-message">{errors.name}</span>}
      </div>
      {/* ... các field khác */}
      <button type="submit">Tạo sản phẩm</button>
    </form>
  );
};
```

## Các loại Error Response

### 1. Trùng tên sản phẩm (409)
```json
{
  "status": "ERR",
  "code": 409,
  "message": "Tên sản phẩm đã tồn tại. Vui lòng chọn tên khác",
  "field": "name",
  "errorType": "DUPLICATE_NAME"
}
```

### 2. Tên sản phẩm rỗng (400)
```json
{
  "status": "ERR",
  "code": 400,
  "message": "Tên sản phẩm không được để trống",
  "field": "name",
  "errorType": "REQUIRED_FIELD"
}
```

### 3. Lỗi server (500)
```json
{
  "status": "ERR",
  "message": "Lỗi server: ..."
}
```

## Lưu ý

1. **Status Code**: 
   - 201: Tạo thành công
   - 200: Cập nhật thành công
   - 400: Lỗi validation
   - 409: Trùng dữ liệu (duplicate)
   - 500: Lỗi server

2. **Error Field**: Field `field` trong response cho biết field nào bị lỗi, giúp frontend highlight field đó.

3. **Error Type**: Field `errorType` giúp frontend xử lý logic đặc biệt cho từng loại lỗi.

4. **Message**: Luôn hiển thị `message` cho người dùng để họ biết lỗi gì.

