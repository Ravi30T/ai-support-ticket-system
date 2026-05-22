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
    return this.usersModel.create(userData);
  }

  async findByEmail(email: string): Promise<UsersDocument | null> {
    return this.usersModel
      .findOne({ email: email.toLowerCase().trim() })
      .populate('role')
      .exec();
  }

  async findById(id: string): Promise<UsersDocument | null> {
    return this.usersModel.findById(id).populate('role').exec();
  }

  async update(id: string, updateData: any): Promise<UsersDocument | null> {
    return this.usersModel
      .findByIdAndUpdate(id, updateData, { new: true })
      .populate('role')
      .exec();
  }
}
