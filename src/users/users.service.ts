import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Users, UsersDocument } from './schemas/user.schema';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectModel(Users.name) private readonly usersModel: Model<UsersDocument>,
  ) {}

  async create(userData: any): Promise<UsersDocument> {
    try {
      return await this.usersModel.create(userData);
    } catch (error) {
      this.logger.error('Error creating user', error);
      throw error;
    }
  }

  async findByEmail(email: string): Promise<UsersDocument | null> {
    try {
      return await this.usersModel
        .findOne({ email: email.toLowerCase().trim() })
        .populate('role')
        .exec();
    } catch (error) {
      this.logger.error(`Error finding user by email: ${email}`, error);
      throw error;
    }
  }

  async findById(id: string): Promise<UsersDocument | null> {
    try {
      return await this.usersModel.findById(id).populate('role').exec();
    } catch (error) {
      this.logger.error(`Error finding user by id: ${id}`, error);
      throw error;
    }
  }

  async update(id: string, updateData: any): Promise<UsersDocument | null> {
    try {
      return await this.usersModel
        .findByIdAndUpdate(id, updateData, { new: true })
        .populate('role')
        .exec();
    } catch (error) {
      this.logger.error(`Error updating user with id: ${id}`, error);
      throw error;
    }
  }
}
