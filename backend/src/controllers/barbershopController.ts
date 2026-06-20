import { Request, Response } from 'express';
import prisma from '../prisma';

// Public: Get barbershop data by slug (used by the booking page)
export const getBarbershopBySlug = async (req: Request, res: Response) => {
  const { slug } = req.params;

  try {
    const barbershop = await prisma.barbershop.findUnique({
      where: { slug },
      include: {
        services: true,
        barbers: {
          include: {
            schedules: true
          }
        }
      }
    });

    if (!barbershop) {
      return res.status(404).json({ error: 'Barbearia não encontrada.' });
    }

    res.json(barbershop);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Falha ao buscar dados da barbearia.' });
  }
};

// Admin: List all barbershops
export const getAllBarbershops = async (req: Request, res: Response) => {
  try {
    const barbershops = await prisma.barbershop.findMany({
      include: {
        _count: {
          select: { barbers: true, services: true, appointments: true }
        }
      },
      orderBy: { createdAt: 'asc' }
    });
    res.json(barbershops);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Falha ao listar barbearias.' });
  }
};

// Admin: Create a new barbershop
export const createBarbershop = async (req: Request, res: Response) => {
  const { name, slug, phone, address, logoUrl } = req.body;

  if (!name || !slug) {
    return res.status(400).json({ error: 'Nome e slug são obrigatórios.' });
  }

  try {
    const existing = await prisma.barbershop.findUnique({ where: { slug } });
    if (existing) {
      return res.status(409).json({ error: 'Este slug já está em uso. Escolha outro.' });
    }

    const barbershop = await prisma.barbershop.create({
      data: { name, slug, phone, address, logoUrl }
    });
    res.status(201).json(barbershop);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Falha ao criar barbearia.' });
  }
};

// Admin: Update a barbershop
export const updateBarbershop = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, slug, phone, address, logoUrl } = req.body;

  try {
    const barbershop = await prisma.barbershop.update({
      where: { id },
      data: { name, slug, phone, address, logoUrl }
    });
    res.json(barbershop);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Falha ao atualizar barbearia.' });
  }
};
