/**
 * WatermelonDB Models for Al-Ghazaly Auto Parts
 * Each model represents a table in the local database
 * Using class field declarations compatible with decorators
 */
import { Model } from '@nozbe/watermelondb';
import { field, date, readonly, text } from '@nozbe/watermelondb/decorators';

// Car Brand Model
export class CarBrand extends Model {
  static table = 'car_brands';

  @field('server_id') serverId: string;
  @field('name') name: string;
  @field('name_ar') nameAr: string;
  @field('logo') logo: string | null;
  @readonly @date('created_at') createdAt: Date;
  @date('updated_at') updatedAt: Date;
}

// Car Model Model
export class CarModel extends Model {
  static table = 'car_models';

  @field('server_id') serverId: string;
  @field('brand_id') brandId: string;
  @field('name') name: string;
  @field('name_ar') nameAr: string;
  @field('year_start') yearStart: number | null;
  @field('year_end') yearEnd: number | null;
  @field('image_url') imageUrl: string | null;
  @field('description') description: string | null;
  @field('description_ar') descriptionAr: string | null;
  @text('variants') variants: string | null;
  @readonly @date('created_at') createdAt: Date;
  @date('updated_at') updatedAt: Date;

  get variantsParsed(): any[] {
    try {
      return this.variants ? JSON.parse(this.variants) : [];
    } catch {
      return [];
    }
  }
}

// Product Brand Model
export class ProductBrand extends Model {
  static table = 'product_brands';

  @field('server_id') serverId: string;
  @field('name') name: string;
  @field('name_ar') nameAr: string | null;
  @field('logo') logo: string | null;
  @field('country_of_origin') countryOfOrigin: string | null;
  @field('country_of_origin_ar') countryOfOriginAr: string | null;
  @readonly @date('created_at') createdAt: Date;
  @date('updated_at') updatedAt: Date;
}

// Category Model
export class Category extends Model {
  static table = 'categories';

  @field('server_id') serverId: string;
  @field('name') name: string;
  @field('name_ar') nameAr: string;
  @field('parent_id') parentId: string | null;
  @field('icon') icon: string | null;
  @field('sort_order') sortOrder: number;
  @readonly @date('created_at') createdAt: Date;
  @date('updated_at') updatedAt: Date;
}

// Product Model
export class Product extends Model {
  static table = 'products';

  @field('server_id') serverId: string;
  @field('name') name: string;
  @field('name_ar') nameAr: string;
  @field('description') description: string | null;
  @field('description_ar') descriptionAr: string | null;
  @field('price') price: number;
  @field('sku') sku: string;
  @field('product_brand_id') productBrandId: string | null;
  @field('category_id') categoryId: string | null;
  @field('image_url') imageUrl: string | null;
  @text('images') images: string | null;
  @text('car_model_ids') carModelIds: string | null;
  @field('stock_quantity') stockQuantity: number;
  @field('hidden_status') hiddenStatus: boolean;
  @readonly @date('created_at') createdAt: Date;
  @date('updated_at') updatedAt: Date;

  get imagesParsed(): string[] {
    try {
      return this.images ? JSON.parse(this.images) : [];
    } catch {
      return [];
    }
  }

  get carModelIdsParsed(): string[] {
    try {
      return this.carModelIds ? JSON.parse(this.carModelIds) : [];
    } catch {
      return [];
    }
  }
}

// Favorite Model
export class Favorite extends Model {
  static table = 'favorites';

  @field('server_id') serverId: string | null;
  @field('user_id') userId: string;
  @field('product_id') productId: string;
  @readonly @date('created_at') createdAt: Date;
  @date('updated_at') updatedAt: Date;
}

// Cart Item Model (local-only until checkout)
export class CartItem extends Model {
  static table = 'cart_items';

  @field('product_id') productId: string;
  @field('quantity') quantity: number;
  @readonly @date('created_at') createdAt: Date;
  @date('updated_at') updatedAt: Date;
}

// Sync Metadata Model
export class SyncMetadata extends Model {
  static table = 'sync_metadata';

  @field('table_name') tableName: string;
  @field('last_pulled_at') lastPulledAt: number;
}
