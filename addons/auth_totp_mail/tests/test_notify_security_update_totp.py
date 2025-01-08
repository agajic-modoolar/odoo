# Part of Odoo. See LICENSE file for full copyright and licensing details.

from datetime import datetime, timedelta

from odoo.addons.auth_totp.controllers.home import TRUSTED_DEVICE_AGE
from odoo.addons.mail.tests.test_res_users import TestNotifySecurityUpdate
from odoo.tests import users


class TestNotifySecurityUpdateTotp(TestNotifySecurityUpdate):
    @users('employee')
    def test_security_update_totp_enabled_disabled(self):
        recipients = [self.env.user.email_formatted]
        with self.mock_mail_gateway():
            self.env.user.write({'totp_secret': 'test'})

        self.assertSentEmail(
            '"YourTestCompany" <your.company@example.com>',
            recipients,
            subject='Security Update: 2FA Activated',
        )

        with self.mock_mail_gateway():
            self.env.user.write({'totp_secret': False})

        self.assertSentEmail(
            '"YourTestCompany" <your.company@example.com>',
            recipients,
            subject='Security Update: 2FA Deactivated',
        )

    @users('employee')
    def test_security_update_trusted_device_added_removed(self):
        """ Make sure we notify the user when TOTP trusted devices are removed on his account. """
        recipients = [self.env.user.email_formatted]
        with self.mock_mail_gateway():
            self.env['auth_totp.device'].sudo()._generate(
                'trusted_device_chrome',
                'Chrome on Windows',
                datetime.now() + timedelta(seconds=TRUSTED_DEVICE_AGE)
            )

        self.assertNotSentEmail(recipients)

        # now remove the key using the user's relationship
        with self.mock_mail_gateway():
            self.env['auth_totp.device'].flush_model()
            self.env.user.sudo(False)._revoke_all_devices()

        self.assertSentEmail(
            '"YourTestCompany" <your.company@example.com>',
            recipients,
            subject='Security Update: Device Removed',
        )
