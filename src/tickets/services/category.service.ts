import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Categories, CategoriesDocument } from '../schemas/category.schema';
import { CreateCategoryDTO } from '../dto/category.dto';

@Injectable()
export class CategoryService {
  private readonly logger = new Logger(CategoryService.name);

  constructor(
    @InjectModel(Categories.name)
    private readonly categoriesModel: Model<CategoriesDocument>,
  ) {}

  async createCategory(dto: CreateCategoryDTO): Promise<{
    success: boolean;
    status_code: number;
    message: string;
    data?: any;
  }> {
    try {
      const nameNormalized = dto.name.trim();
      const exist = await this.categoriesModel
        .findOne({ name: { $regex: new RegExp(`^${nameNormalized}$`, 'i') } })
        .exec();
      if (exist) {
        return {
          success: false,
          status_code: 409,
          message: 'Category with this name already exists',
        };
      }

      const newCategory = await this.categoriesModel.create({
        name: nameNormalized,
        description: dto.description?.trim(),
      });

      return {
        success: true,
        status_code: 201,
        message: 'Category created successfully',
        data: newCategory,
      };
    } catch (error) {
      this.logger.error('Error in create category', error);
      return {
        success: false,
        status_code: 500,
        message: 'Failed to create category',
      };
    }
  }

  async findById(id: string): Promise<CategoriesDocument | null> {
    try {
      return this.categoriesModel.findById(id).exec();
    } catch (error) {
      this.logger.error('Error in findById', error);
      return null;
    }
  }
}
