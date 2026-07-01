# Technical field guide (technician-side reference)

Deep-technical reference material for HVAC diagnostics, system
theory, and field practice. The customer-facing chat does not
quote this material directly at homeowners; it uses it when a
technically knowledgeable visitor asks a detailed question, or when
someone on the HVAC-professional side wants to see that the tool is
grounded in real trade knowledge. When answering a homeowner, still
follow the "no diagnosis by chat" rule from behaviors.md.

## 1. Core HVAC fundamentals and thermodynamics

### Basic principles of heat transfer

- Heat naturally moves from higher temperature to lower
  temperature. HVAC systems use mechanical energy to reverse or
  amplify that natural flow.
- Sensible heat is the energy that changes the temperature of a
  substance without changing its state. Measured directly with a
  thermometer.
- Latent heat is the hidden energy that drives a phase change
  (liquid to gas, gas to liquid) at constant temperature. Critical
  for understanding air conditioner dehumidification.

Methods of heat transfer:
- Conduction: through direct physical contact (heat through a heat
  exchanger wall).
- Convection: via a moving fluid or gas (forced warm air through
  supply ductwork).
- Radiation: via electromagnetic waves without warming the space
  in between (infrared radiant tube heaters in a warehouse).

Sensible heat equation for airflow / temperature rise:
q = 1.08 x CFM x deltaT, where q is BTU/h, CFM is cubic feet per
minute, deltaT is the temperature difference across the heat
source.

Total heat equation for cooling load including moisture removal:
q = 4.5 x CFM x deltaH, where deltaH is the change in enthalpy
(total heat content per pound of dry air).

### Pressure and temperature relationships

- Saturation temperature: the boiling or condensing point of a
  fluid at a given pressure. In HVAC systems, any change in
  refrigerant pressure directly shifts its boiling or condensing
  temperature.
- Superheat: temperature of a vapor above its saturation point at
  a given pressure. Calculated as (actual suction line
  temperature) minus (saturation suction temperature). Zero
  superheat means liquid is hitting the compressor, which will
  destroy it.
- Subcooling: temperature of a liquid below its saturation
  (condensing) point at a given pressure. Calculated as
  (saturation liquid temperature) minus (actual liquid line
  temperature). Indicates how much liquid refrigerant is backing
  up in the condenser coil. Definitive metric for charging TXV
  systems.

## 2. High-efficiency gas furnaces (90%+ AFUE)

### Mechanical design and system flow

- Primary heat exchanger: heavy-gauge aluminized steel. Receives
  the raw combustion flame from the burners and handles the
  highest thermal stress.
- Secondary heat exchanger: marine-grade stainless steel. Handles
  the highly corrosive acidic condensate (pH 3 to 5) formed when
  combustion flue gases drop below their dew point (around 130°F /
  54°C).
- Inducer draft blower: pulls fresh combustion air into the burner
  assembly, draws hot flue gases through both heat exchangers, and
  vents exhaust outside via PVC pipe.

Gas valve typologies:
- Single-stage: 100% open or fully closed.
- Two-stage: low fire (60 to 70% capacity) for mild days, high
  fire (100%) for extreme cold.
- Modulating: electronic stepper motor adjusts gas flow in 1%
  increments from 35% to 100% to match real-time heat loss.

Modern high-efficiency furnaces use inshot burners that inject gas
through an orifice into a venturi throat, drawing primary
combustion air before hitting the igniter.

### Sequence of operation

1. Call for heat: thermostat closes the R (24V) to W circuit.
2. Safety interlock check: integrated furnace control (IFC)
   verifies limit switches and rollout switches are closed.
3. Pre-purge: inducer motor runs to clear residual unburned gas.
   Pressure switch closes to confirm venting airflow.
4. Ignition activation: control board sends voltage to hot surface
   igniter (HSI) or direct spark igniter (DSI).
5. Gas valve energization: gas valve opens, fuel meets the ignition
   source.
6. Flame rectification proof: flame sensor must detect microamp
   current within a strict safety window (4 to 7 seconds).
   Unproven flame shuts the gas valve immediately.
7. Post-purge and blower delay: main indoor blower waits 30 to 45
   seconds to allow the heat exchanger to warm before pushing air
   into the living space.
8. Satisfied call: thermostat opens R-W. Gas valve closes. Blower
   continues 90 to 180 seconds to extract remaining latent heat.

### Critical component failures

Hot Surface Igniter (HSI): silicon carbide or silicon nitride.
Develops micro-cracks over time. Silicon carbide reads 40 to 90
ohms; an open circuit (OL) indicates a failed igniter.

Flame sensor: stainless steel rod using flame rectification. #1
field service call - carbon monoxide and airborne silica deposit
an invisible insulating layer on the rod, causing 2 to 5 second
firing followed by drop-out. Fix: clean with a non-conductive
abrasive pad. Never use sandpaper because silica melts onto the
rod.

Differential pressure switches: monitor the negative pressure the
inducer produces. Common failures: cracked or moist silicone
sensing tubes, cracked or clogged PVC vent pipe, failing inducer
motor, clogged condensate trap backing water into the collector
box.

Rollout switches: manual-reset thermal discs near the burners.
Open if flames roll backwards from a cracked heat exchanger or
completely blocked vent.

High-limit switch: automatic-reset bimetal directly above the heat
exchanger. Opens if internal air temperatures exceed 140°F to
200°F (60°C to 93°C). Primary tripping causes: restricted airflow
from dirty filters, crushed return ducts, undersized ducts, or a
failing blower motor.

## 3. High-efficiency air conditioning and heat pumps

### Core refrigeration cycle

1. Compressor: takes low-temperature, low-pressure superheated
   vapor from the suction line and compresses it to
   high-temperature, high-pressure superheated vapor.
2. Condenser (heat rejection): high-pressure vapor enters the
   outdoor coil. Fans move cooler outdoor air across the fins,
   transferring heat out of the refrigerant. It condenses to a
   high-pressure, subcooled liquid.
3. Metering device: TXV or electronic expansion valve (EEV).
   Restricts flow, causing a sudden pressure drop that flashes
   some liquid to vapor and instantly drops the mix's temperature.
4. Evaporator (heat absorption): low-pressure, low-temperature
   liquid-vapor mix enters the indoor coil. Warm indoor air passes
   over it. Refrigerant absorbs the heat, boils fully to a
   low-pressure vapor, picks up superheat, and returns to the
   compressor.

### Advanced heat pump operation

Reversing valve (4-way valve): differentiates a heat pump from a
standard AC. A pilot solenoid valve shifts an internal slider
block, redirecting discharge vapor from the compressor to either
the outdoor coil (cooling mode) or the indoor coil (heating mode).

Failures: solenoid coil can burn out (reads open ohms).
Mechanically the internal slider can get stuck midway due to
debris or lack of oil migration, causing refrigerant to bypass and
balance suction and discharge pressures.

Defrost cycle: outdoor coil acts as evaporator in heating and
accumulates frost below 32°F (0°C). The defrost board shifts the
reversing valve back into cooling mode, shuts off the outdoor fan,
and activates indoor auxiliary electric heat strips. Outdoor coil
becomes a condenser and melts the ice sheet with compressor heat.
Initiation methods: time-temperature (mechanical clock and sensor)
or demand defrost (electronic sensors measuring outdoor
air-to-coil temperature variance).

### Refrigerants (2026 landscape)

- R-22: completely obsolete.
- R-410A: restricted in new equipment due to high global warming
  potential. Reclaimed R-410A is still legal for servicing existing
  systems.
- A2L refrigerants (R-454B and R-32): industry-standard for new
  high-efficiency systems. Mildly flammable. Handling requires
  spark-proof recovery machines, vacuum pumps with brushless
  motors, left-hand-threaded recovery cylinder valves, and
  mandatory mitigation sensors in residential air handlers.
- Polyolester (POE) oil is used for HFC and A2L systems. Highly
  hygroscopic. Open refrigerant lines must never be exposed to
  atmosphere for extended periods.

### Variable-speed / inverter compressors

Inverter drive takes AC voltage, rectifies to DC, then uses an
Intelligent Power Module (IPM) to recreate a variable-frequency
AC sine wave to drive a three-phase DC permanent magnet motor.
Allows the compressor to modulate down to 10 to 20% capacity,
matching minute-by-minute heat loads, preventing short-cycling,
and delivering high SEER2 performance.

## 4. Hydronic heating and water heaters

### Boiler classifications

- Non-condensing (cast iron / steel): return water temp minimum
  140°F (60°C) to prevent acidic exhaust condensation from
  destroying cast iron sections or venting. Efficiency maxes out
  at 80 to 85% AFUE.
- Condensing (mod-con): stainless steel or aluminum-silicon alloy
  heat exchangers. Designed for low return water temps (below
  130°F / 54°C) to capture latent heat. Efficiency 95 to 99%.

### Hydronic safety and trim components

- Expansion tank (diaphragm style): internal rubber membrane
  separates a pressurized air chamber from the hydronic loop.
  Pre-charged to match the system's cold fill pressure (typically
  12 PSI residential two-story). Purpose: water expands when
  heated; the tank cushions expansion so pressure stays below
  safety thresholds.
- Pressure relief valve (PRV): 30 PSI on residential hydronic
  boilers, 15 PSI on steam boilers, 150 PSI / 210°F on domestic
  water heaters.
- Air eliminator (micro-bubble separator): coalesces dissolved air
  out of the closed loop, preventing air locks, velocity noises,
  and localized oxygen corrosion.
- Low water cut-off (LWCO): electronic probe or mechanical float
  safety device. Shuts off the burner instantly if water level
  drops below a safe baseline, preventing dry-fire explosion.
- Aquastat: hydronic control thermostat. Monitors water
  temperature and operates the burner and circulator pumps.
  Typical parameters: high limit 180°F / 82°C, low limit 160°F /
  71°C.

### Water heaters

- Atmospheric storage tanks rely on natural buoyancy of hot
  exhaust gases through an open draft hood and vertical chimney.
- Sacrificial anode rod: magnesium or aluminum rod inside the tank
  that corrodes galvanically to protect the steel tank. Check
  every 2 to 3 years; if wire core is exposed, replace.
- High-efficiency tankless (on-demand) heaters: burn high-input
  gas volumes through modulated burners and a compact heat
  exchanger only when water flow is detected by an internal
  turbine. Minimum flow rate typically 0.5 GPM to trigger ignition.
- Hard water scale: calcium and magnesium precipitate on the heat
  exchanger. Tankless units must be flushed annually with food-
  grade citric or acetic acid to prevent thermal stress fractures.

## 5. Airflow, duct design, and IAQ

### Airflow metrics and diagnostics

Static pressure: outward force air exerts against the interior
walls of a duct. Measured in inches of water column (in. w.c.)
with a digital manometer.

Total External Static Pressure (TESP): supply side (before duct
drops) plus return side (after filter, before blower).

Residential targets:
- Older PSC-blower systems: max 0.50 in. w.c. TESP.
- Modern ECM multi-speed: up to 0.80 or 1.00 in. w.c.

TESP interpretation:
- 0.30 to 0.50 in. w.c.: excellent, maintain routine filter
  schedule.
- 0.55 to 0.75 in. w.c.: marginal, check filter, restrictive
  registers, or moderate duct transitions.
- 0.80+ in. w.c.: severe restriction; inspect undersized returns,
  crushed flex, dirty evaporator coils, or oversized-for-blower
  high-MERV filters.

CFM rules of thumb:
- Cooling mode: 350 to 400 CFM per ton of nominal capacity.
- Gas heating: 11 to 15 CFM per 1,000 BTU/h of input rating.

### Blower motor typologies

- PSC (Permanent Split Capacitor): single-phase AC, fixed speeds.
  Slows down as static pressure rises. Inefficient by modern
  standards.
- ECM constant-torque (X13): brushless DC. Maintains programmed
  torque; airflow drops slightly as static pressure rises.
  Efficient.
- ECM constant-CFM (variable-speed): programmed to hold an exact
  target CFM. Ramps up motor RPM and torque as static pressure
  rises to force air through. Warning: high static pressure makes
  these run loud and can burn out the electronic module.

### Duct design

- Manual D protocol: industry standard for sizing residential
  ductwork based on equivalent fitting lengths, available static
  pressure, and per-room CFM.
- Flex duct integrity: must be pulled taut. Sagging can increase
  friction by up to 400%, starving remote registers.
- Duct sealing: all joints must be mechanically fastened (sheet
  metal screws) and sealed with mastic paste or foil-faced tape.

### MERV filtration tiers

- MERV 1 to 4: standard fiberglass. Protect blower from large lint
  only. Ineffective for air purification.
- MERV 8 to 11: pleated synthetic. Excellent residential balance.
  Catches mold spores, pet dander, fine dust.
- MERV 13 to 16: airborne viruses, bacteria, fine smoke. Often
  needs a 4- to 5-inch deep media cabinet to avoid choking
  airflow.

### HRV vs ERV

- HRV (Heat Recovery Ventilator): transfers sensible heat only
  between exhaust and incoming fresh air. Best in cold, dry
  climates.
- ERV (Energy Recovery Ventilator): transfers both sensible heat
  and latent moisture. Best in hot, humid climates.

## 6. Preventive maintenance checklists

### Cooling season (spring)

- Disconnect check: verify line voltage connections secure,
  inspect disconnect pullout for pitted contacts or loose lugs.
- Capacitor diagnostics under load. Formula: uF = (compressor
  amps x 2652) / capacitor voltage. Replace if capacitance drops
  more than 5% below nominal.
- Contactor inspection: check for pitting, burn marks, or insect
  nesting (ants love 24V magnetic fields).
- Condenser coil hygiene: chemical application and wash from
  inside out to blow embedded dirt out.
- Amperage verification: document operating amps on compressor
  and outdoor fan. Compare to data plate RLA and FLA.
- Drain system: flush condensate lines with hot water or pull a
  vacuum. Install a fresh inline safety float switch.

### Heating season (fall)

- Flame sensor: remove and polish with a non-metallic abrasive
  pad.
- Igniter integrity: measure cold resistance (ohms) to track
  thermal fatigue.
- Heat exchanger: borescope inspection of internal weld lines
  and curves. Conduct combustion analysis for CO PPM and oxygen.
- Burner profiling: clean burner faces and orifices for proper
  gas-to-air mixing.
- Safety limit test: manually block return airflow to confirm
  the high-limit switch opens within spec.
- Gas pressure calibration on the manifold. Natural gas target:
  3.5 in. w.c. for standard single-stage. Liquid propane: 10.0
  in. w.c.

## 7. Refrigerant diagnostics

The four major refrigerant anomalies:

- **Overcharge**: high head pressure, low suction superheat, high
  subcooling, high compressor amps. Liquid backs up into the
  condenser.
- **Undercharge**: low suction, low head, high suction superheat,
  low subcooling, low compressor amps. Liquid seal is lost at the
  expansion device.
- **Restricted metering device** (blocked TXV screen): low suction
  pressure, high suction superheat, high condenser subcooling,
  low head pressure.
- **Low airflow / evaporator starvation**: low suction pressure,
  low suction superheat (air can't transfer heat to boil the
  liquid), normal-to-low subcooling, lower head pressure.

Diagnostic matrix:

| Condition | Suction | Liquid | Superheat | Subcooling | Amps |
|---|---|---|---|---|---|
| Normal | target | target | 8-15°F | 8-12°F | rated RLA |
| Undercharged | low | low | high | low | low |
| Overcharged | high | high | low | high | high |
| Liquid line restriction | low | low or high before block | high | high | low |
| Defective TXV (overfeeding) | high | low | low | low | normal/high |
| Inefficient compressor | high | low | high | low | low |

### Real-world field anomalies

- Ghost pressure switch error: high-efficiency furnace locks out
  on a pressure switch code but the inducer spins fine. Check the
  internal drain trap for insects or sludge; water in the
  collector box blocks the lower pressure port.
- Chattering relays: check high-resistance wire connections or
  measure 24V transformer output voltage. A loose common ground
  or undersized transformer causes voltage drops on load spikes.
- TXV hunting (suction and superheat swinging): check the
  expansion valve sensing bulb placement. If loose, uninsulated,
  or mounted at the 6 o'clock position (where oil runs), it
  cannot track vapor accurately. Mount at 2 or 10 o'clock, clamp
  tight, insulate.

## 8. Electrical controls and low voltage

### Thermostat wiring conventions

| Terminal | Color | Controls |
|---|---|---|
| R | Red | 24VAC transformer hot |
| C | Blue / Black | 24VAC transformer common |
| W | White | Main heating call |
| Y | Yellow | Compressor contactor / cooling call |
| G | Green | Indoor fan / blower relay |
| O / B | Orange / Dark Blue | Reversing valve (O = cool active, B = heat active) |

### Component diagnostics

- Transformers: convert 120V or 240V line voltage down to 24V.
  Test for primary-to-secondary isolation; a zero-ohm reading
  indicates internal winding short.
- Contactors: 24V coil pulls down an armature to close heavy
  contacts. Measure voltage drop across closed contacts while
  running. More than 1V drop across a single pole = severely
  pitted, replace.
- Flame safeguard: all safety switches (rollout, high limit, float
  switch) are wired in series across the 24V loop. Any single
  open circuit drops the gas valve or contactor and locks the
  system down.

### Smart thermostat integration

The C-wire (common) is essential. Smart thermostats have high-draw
Wi-Fi modules and backlit displays that need continuous 24V power.
Attempting to power a smart thermostat without a dedicated C-wire
(by "power stealing" from Y or W) causes chattering contactors,
erratic operation, and can fry control boards on modern
variable-speed equipment. Always run a dedicated common conductor
or install a digital power extender kit.

### Building automation

- Direct Digital Control (DDC): programmable microprocessors
  embedded in RTUs, chillers, and VAV zones. Collect data from
  space thermistors, static sensors, humidity probes to calculate
  damper movements.
- BACnet and Modbus: open standardized communication protocols
  that let equipment from different manufacturers share a two-
  wire network bus (MS/TP) or Ethernet. Facility managers adjust
  parameters, monitor alarms, and execute schedules from a unified
  dashboard.
