import { Injectable, UnauthorizedException } from '@nestjs/common';
import { signInDTO, signUpDTO } from './dtos/auth';
import { PrismaService } from 'src/prisma/prisma.service';
import * as bcrypt from 'bcrypt'
import { identity } from 'rxjs';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
    constructor(private prismaService: PrismaService, private jwtService: JwtService){}

    async signup(data: signUpDTO){
       const userAlreadyExists = await this.prismaService.user.findUnique({
            where: {
                email: data.email
            }
        })

        if(userAlreadyExists){
            throw new UnauthorizedException('User Already Exists.')
        }

        const hashedPassword = await bcrypt.hash(data.password, 10)

        const user =  await this.prismaService.user.create({
            data: {
                ...data,
                password: hashedPassword
            }
        })

        return {
            id: user.id,
            email: user.email,
            name: user.name
        }
      }
    
      async signin(data: signInDTO){
        const user = await this.prismaService.user.findUnique({
            where: {
                email: data.email
            }
        })

        if(!user){
            throw new UnauthorizedException('Invalid Credentials.')
        }

        const passwordMatch = await bcrypt.compare(data.password, user.password)

        if(!passwordMatch){
            throw new UnauthorizedException('Invalid Credentials.')
        }

        const accessToken = await this.jwtService.signAsync({
            id: user.id,
            name: user.name,
            email: user.email
        })

        return {
            accessToken
        }
      }
}
