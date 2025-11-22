// src/components/admin/ProductForm.tsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { productAPI } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ArrowLeftIcon, SaveIcon } from 'lucide-react';
import { toast } from 'sonner';

interface ProductFormData {
  title: string;
  image: string;
  price: string;
  unit: string;
  description: string;
  fullDescription: string;
  ingredients: string;
  usageInstructions: string;
}

const defaultProductData: ProductFormData = {
  title: '',
  image: '',
  price: '',
  unit: '',
  description: '',
  fullDescription: '',
  ingredients: '',
  usageInstructions: '',
};

const ProductForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const isEditMode = id !== 'new';
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState<ProductFormData>(defaultProductData);
  const [loading, setLoading] = useState<boolean>(isEditMode);
  const [submitting, setSubmitting] = useState<boolean>(false);

  useEffect(() => {
    const fetchProduct = async () => {
      if (isEditMode) {
        try {
          const product = await productAPI.getProduct(id!);
          setFormData({
            title: product.title,
            image: product.image,
            price: product.price,
            unit: product.unit,
            description: product.description,
            fullDescription: product.fullDescription,
            ingredients: product.ingredients,
            usageInstructions: product.usageInstructions,
          });
          setLoading(false);
        } catch (error) {
          console.error('Error fetching product:', error);
          toast.error('Failed to load product data');
          navigate('/admin/dashboard');
        }
      }
    };

    fetchProduct();
  }, [id, isEditMode, navigate]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      if (isEditMode) {
        await productAPI.updateProduct(id!, formData);
        toast.success('Product updated successfully');
      } else {
        await productAPI.createProduct(formData);
        toast.success('Product created successfully');
      }
      navigate('/admin/dashboard');
    } catch (error) {
      console.error('Error saving product:', error);
      toast.error(isEditMode ? 'Failed to update product' : 'Failed to create product');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center mb-6">
        <Button variant="ghost" onClick={() => navigate('/admin/dashboard')} className="mr-4">
          <ArrowLeftIcon className="h-4 w-4 mr-2" />
          Back
        </Button>
        <h1 className="text-3xl font-bold">
          {isEditMode ? 'Edit Product' : 'Add New Product'}
        </h1>
      </div>

      <Card className="max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle>Product Information</CardTitle>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="title">Product Name*</Label>
                <Input
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="image">Image URL*</Label>
                <Input
                  id="image"
                  name="image"
                  value={formData.image}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="price">Price*</Label>
                <Input
                  id="price"
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="unit">Unit*</Label>
                <Input
                  id="unit"
                  name="unit"
                  value={formData.unit}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Short Description*</Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={2}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="fullDescription">Full Description*</Label>
              <Textarea
                id="fullDescription"
                name="fullDescription"
                value={formData.fullDescription}
                onChange={handleChange}
                rows={4}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="ingredients">Ingredients*</Label>
              <Textarea
                id="ingredients"
                name="ingredients"
                value={formData.ingredients}
                onChange={handleChange}
                rows={2}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="usageInstructions">Usage Instructions*</Label>
              <Textarea
                id="usageInstructions"
                name="usageInstructions"
                value={formData.usageInstructions}
                onChange={handleChange}
                rows={2}
                required
              />
            </div>
          </CardContent>
          <CardFooter className="flex justify-end space-x-2">
            <Button
              variant="outline"
              type="button"
              onClick={() => navigate('/admin/dashboard')}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              <SaveIcon className="h-4 w-4 mr-2" />
              {submitting
                ? isEditMode
                  ? 'Updating...'
                  : 'Creating...'
                : isEditMode
                ? 'Update Product'
                : 'Create Product'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default ProductForm;