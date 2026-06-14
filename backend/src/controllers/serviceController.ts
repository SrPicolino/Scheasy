import { Request, Response } from 'express';
import prisma from '../prisma';

export const getServices = async (req: Request, res: Response) => {
  try {
    const services = await prisma.service.findMany();
    res.json(services);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch services' });
  }
};

export const createService = async (req: Request, res: Response) => {
  const { name, description, price, duration } = req.body;
  try {
    const service = await prisma.service.create({
      data: { name, description, price, duration },
    });
    res.json(service);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create service' });
  }
};

export const updateService = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, description, price, duration } = req.body;
  try {
    const service = await prisma.service.update({
      where: { id },
      data: { name, description, price, duration },
    });
    res.json(service);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update service' });
  }
};

export const deleteService = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    await prisma.service.delete({ where: { id } });
    res.json({ message: 'Service deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete service' });
  }
};

