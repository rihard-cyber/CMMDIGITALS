package com.jdc.sapujagat.patrol;

import android.provider.Settings;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "DeviceSecurity")
public class DeviceSecurityPlugin extends Plugin {
    @PluginMethod
    public void checkSecurity(PluginCall call) {
        JSObject ret = new JSObject();
        boolean devOptions = false;
        boolean adbEnabled = false;
        try {
            int devMode = Settings.Global.getInt(
                getContext().getContentResolver(),
                Settings.Global.DEVELOPMENT_SETTINGS_ENABLED,
                0
            );
            devOptions = (devMode != 0);

            int adbMode = Settings.Global.getInt(
                getContext().getContentResolver(),
                Settings.Global.ADB_ENABLED,
                0
            );
            adbEnabled = (adbMode != 0);
        } catch (Exception e) {
            devOptions = false;
            adbEnabled = false;
        }
        ret.put("developerOptionsEnabled", devOptions || adbEnabled);
        ret.put("isAndroid", true);
        call.resolve(ret);
    }
}
