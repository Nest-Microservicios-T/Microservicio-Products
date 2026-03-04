/* eslint-disable @typescript-eslint/no-unused-vars */
import { HttpStatus, Injectable, NotFoundException } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { PrismaService } from 'src/prisma.service';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { RpcException } from '@nestjs/microservices';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}
  async create(createProductDto: CreateProductDto) {
    //console.log({ createProductDto });
    const product = await this.prisma.product.create({
      data: {
        ...createProductDto,
        price: Number(createProductDto.price),
      },
    });
    return product;
  }

  async findAll(paginationDto: PaginationDto) {
    const { limit = 10, page = 1 } = paginationDto;
    const totalPages = await this.prisma.product.count({
      where: { available: true },
    });
    const lastPage = Math.ceil(totalPages / limit);
    return {
      data: await this.prisma.product.findMany({
        skip: (page - 1) * limit,
        take: limit,
        where: { available: true },
      }),
      meta: {
        total: totalPages,
        page: page,
        lastPage: lastPage,
      },
    };
  }

  async findOne(id: number) {
    const product = await this.prisma.product.findFirst({
      where: { id: id, available: true },
    });
    if (!product) {
      throw new RpcException({
        message: `Product with id ${id} not found`,
        status: HttpStatus.BAD_REQUEST,
      });
    }
    console.log(product);
    return product;
  }

  async update(id: number, updateProductDto: UpdateProductDto) {
    const { id: __, ...data } = updateProductDto;
    await this.findOne(id);
    return this.prisma.product.update({
      where: { id },
      data: data,
    });
  }

  //para borrar
  async remove(id: number) {
    // return this.prisma.product.delete({
    //   where: { id },
    // });
    await this.findOne(id);
    const product = await this.prisma.product.update({
      where: { id },
      data: {
        available: false,
      },
    });
    return product;
  }

  async validateProducts(ids: number[]) {
    ids = Array.from(new Set(ids)); // eliminar duplicados
    const products = await this.prisma.product.findMany({
      where: {
        id: {
          in: ids,
        },
      },
    });

    if (products.length !== ids.length) {
      throw new RpcException({
        message: 'Some products were not found',
        status: HttpStatus.BAD_REQUEST,
      });
    }

    return products;
  }
}
