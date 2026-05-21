import { IsString, IsNotEmpty, IsOptional } from "class-validator";

export class CreateRoleDTO {
    @IsString()
    @IsNotEmpty()
    name: string;

    @IsString()
    @IsNotEmpty()
    description: string;
}

export class UpdateRoleDTO {
    @IsString()
    @IsOptional()
    name: string;

    @IsString()
    @IsOptional()
    description: string;
}