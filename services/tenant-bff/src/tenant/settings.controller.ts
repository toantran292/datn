import {
  Controller,
  Get,
  Patch,
  Post,
  Delete,
  Body,
  Req,
  UseGuards,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { HmacGuard } from '../common/guards/hmac.guard';
import { IdentityService } from '../services/identity.service';
import { SettingsService } from './settings.service';

@Controller('settings')
@UseGuards(HmacGuard)
export class SettingsController {
  constructor(
    private readonly identityService: IdentityService,
    private readonly settingsService: SettingsService,
  ) {}

  // Transform Identity response to frontend format
  private async transformOrgSettings(data: any) {
    // Get presigned URL for logo if assetId exists
    const logoUrl = data.logoAssetId
      ? await this.settingsService.getLogoUrl(data.logoAssetId)
      : undefined;

    return {
      id: data.orgId,
      name: data.displayName,
      description: data.description || '',
      logoUrl,
      slug: data.slug,
      status: data.status,
      settings: data.settings,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  @Get()
  async getSettings(@Req() req) {
    const orgId = req.orgId;
    const data = await this.identityService.getOrgSettings(orgId);
    return this.transformOrgSettings(data);
  }

  @Patch()
  async updateSettings(
    @Req() req,
    @Body() body: { name?: string; description?: string },
  ) {
    const orgId = req.orgId;
    const data = await this.identityService.updateOrgSettings(orgId, body);
    return this.transformOrgSettings(data);
  }

  // Step 1: Get presigned URL for logo upload
  @Post('logo/presigned-url')
  async getLogoPresignedUrl(
    @Req() req,
    @Body() body: { originalName: string; mimeType: string; size: number },
  ) {
    const orgId = req.orgId;
    const result = await this.settingsService.getUploadPresignedUrl(orgId, body);
    return result;
  }

  // Step 2: Confirm logo upload and update org
  @Post('logo/confirm')
  async confirmLogoUpload(
    @Req() req,
    @Body() body: { assetId: string },
  ) {
    const orgId = req.orgId;

    // Confirm upload in file-storage
    await this.settingsService.confirmUpload(body.assetId);

    // Update org with new logo asset ID
    await this.identityService.updateOrgLogo(orgId, body.assetId);

    // Return updated settings with presigned URL
    const data = await this.identityService.getOrgSettings(orgId);
    return this.transformOrgSettings(data);
  }

  @Delete('logo')
  async deleteLogo(@Req() req) {
    const orgId = req.orgId;

    // Delete logo from file-storage (optional - we can keep the file)
    // await this.settingsService.deleteLogo(orgId);

    // Remove logo URL from org
    await this.identityService.updateOrgLogo(orgId, null);

    // Return updated settings
    const data = await this.identityService.getOrgSettings(orgId);
    return this.transformOrgSettings(data);
  }

  @Delete('organization')
  async deleteOrganization(@Req() req) {
    const orgId = req.orgId;
    const userRole = req.user?.roles?.[0];

    // Only owner can delete organization
    if (userRole !== 'OWNER') {
      throw new HttpException(
        'Only the organization owner can delete this organization',
        HttpStatus.FORBIDDEN,
      );
    }

    return this.identityService.deleteOrganization(orgId);
  }
}
