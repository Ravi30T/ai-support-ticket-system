import { Controller, Logger } from "@nestjs/common";
import { UpdateUserDTO } from "./dto/user.dto";

@Controller('/user')
export class UsersController {
    private readonly logger = new Logger(UsersController.name);
    constructor() {
    }
}